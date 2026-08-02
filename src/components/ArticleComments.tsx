import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentsQuery } from "@/lib/queries";
import { sendComment } from "@/lib/feeds.functions";
import { relativeDate } from "@/lib/format";
import { CardListSkeleton, ErrorRetry } from "@/components/Async";

export function ArticleComments({ postId }: { postId: number }) {
  const qc = useQueryClient();
  const commentsQ = useQuery(commentsQuery(postId));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => sendComment({ data: { postId, name, email, content } }),
    onSuccess: (res) => {
      setFeedback({ ok: res.ok, message: res.message });
      if (res.ok) {
        setContent("");
        void qc.invalidateQueries({ queryKey: ["comments", postId] });
      }
    },
    onError: (err: Error) => setFeedback({ ok: false, message: err.message }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    mutation.mutate();
  };

  const comments = commentsQ.data ?? [];

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-extrabold text-ink">
        Commentaires {comments.length > 0 && <span className="text-inkmute">({comments.length})</span>}
      </h2>

      <form onSubmit={onSubmit} className="mt-3 space-y-2 rounded-2xl border border-line bg-panel p-3 shadow-soft">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
            className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-inkmute focus:border-brand"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="E-mail"
            className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-inkmute focus:border-brand"
            required
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Votre commentaire…"
          className="w-full resize-y rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-inkmute focus:border-brand"
          required
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-inkmute">Votre e-mail ne sera pas publié.</p>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-blood px-4 py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
          >
            <span
              className={"material-symbols-outlined " + (mutation.isPending ? "animate-spin" : "")}
              style={{ fontSize: 18 }}
            >
              {mutation.isPending ? "progress_activity" : "send"}
            </span>
            Publier
          </button>
        </div>
        {feedback && (
          <p className={"text-xs font-semibold " + (feedback.ok ? "text-brand" : "text-blood")}>
            {feedback.message}
          </p>
        )}
      </form>

      <div className="mt-4">
        {commentsQ.isPending ? (
          <CardListSkeleton rows={2} />
        ) : commentsQ.isError ? (
          <ErrorRetry
            message="Commentaires indisponibles."
            onRetry={() => void commentsQ.refetch()}
            busy={commentsQ.isFetching}
          />
        ) : comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-inkmute">
            Aucun commentaire pour l'instant. Soyez le premier à réagir.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className={
                  "rounded-2xl border border-line bg-panel p-3 shadow-soft " +
                  (c.parent ? "ml-6" : "")
                }
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                    {c.author.slice(0, 1).toUpperCase()}
                  </span>
                  <p className="truncate text-sm font-bold text-ink">{c.author}</p>
                  <span className="ml-auto shrink-0 text-[11px] text-inkmute">{relativeDate(c.date)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/90">{c.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
