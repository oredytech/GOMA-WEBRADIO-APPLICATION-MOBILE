import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Screen } from "@/components/Screen";
import { articlesQuery, podcastQuery } from "@/lib/queries";
import { TimeAgo } from "@/components/TimeAgo";

export const Route = createFileRoute("/recherche")({
  component: Recherche,
  head: () => ({
    meta: [
      { title: "Recherche — GOMA WEBRADIO" },
      { name: "description", content: "Recherchez des podcasts et des articles sur Goma Webradio." },
      { property: "og:title", content: "Recherche — GOMA WEBRADIO" },
      { property: "og:description", content: "Trouvez rapidement un contenu." },
    ],
    links: [{ rel: "canonical", href: "/recherche" }],
  }),
});

const suggestions = ["Nord-Kivu", "Paix", "Politique", "Musique", "Reportage"];

function Recherche() {
  const [q, setQ] = useState("");
  const { data: articles = [] } = useQuery({ ...articlesQuery({ search: q, perPage: 8 }), enabled: q.length > 2 });
  const { data: show } = useQuery(podcastQuery());
  const episodes = (show?.episodes ?? []).filter(
    (e) => q.length > 2 && e.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Screen title="Recherche" back>
      <div className="mt-4 flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-3 shadow-soft">
        <span className="material-symbols-outlined text-inkmute">search</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Podcasts, articles, émissions…"
          className="w-full border-0 bg-transparent p-0 text-sm text-ink placeholder:text-inkmute focus:outline-none focus:ring-0"
        />
      </div>

      {q.length <= 2 && (
        <div className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-inkmute">Suggestions</h2>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setQ(s)} className="rounded-full border border-line bg-panel px-4 py-2 text-xs font-bold text-ink active:scale-95">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {episodes.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg font-extrabold text-ink">Podcasts</h2>
          <div className="space-y-3">
            {episodes.slice(0, 5).map((e) => (
              <Link key={e.id} to="/podcasts/$id" params={{ id: e.id }} className="flex gap-3 rounded-2xl border border-line bg-panel p-3 shadow-soft">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-panel2">
                  {e.image && <img src={e.image} alt={e.title} className="h-full w-full object-cover" />}
                </div>
                <p className="line-clamp-2 flex-1 text-sm font-bold text-ink">{e.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg font-extrabold text-ink">Articles</h2>
          <div className="space-y-3">
            {articles.map((a) => (
              <Link key={a.id} to="/articles/$slug" params={{ slug: a.slug }} className="flex gap-3 rounded-2xl border border-line bg-panel p-3 shadow-soft">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-panel2">
                  {a.image && <img src={a.image} alt={a.title} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold text-ink">{a.title}</p>
                  <p className="truncate text-xs text-inkmute"><TimeAgo date={a.date} /></p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Screen>
  );
}
