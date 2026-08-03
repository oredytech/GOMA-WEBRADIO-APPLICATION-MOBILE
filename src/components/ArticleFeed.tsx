import { Link } from "@tanstack/react-router";
import { SmartImage } from "@/components/SmartImage";
import { TimeAgo } from "@/components/TimeAgo";
import type { Article } from "@/lib/feeds.types";

export function ArticleFeed({ articles }: { articles: Article[] }) {
  return (
    <div className="space-y-4">
      {articles.map((a) => (
        <article key={a.id} className="overflow-hidden rounded-2xl border border-line bg-panel shadow-soft">
          <Link to="/articles/$slug" params={{ slug: a.slug }}>
            <div className="w-full bg-panel2">
              <SmartImage
                src={a.image}
                alt={a.title}
                className="max-h-72 w-full object-contain"
                fallbackClassName="h-48 w-full bg-brand-deep object-contain p-8"
              />
            </div>
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand">{a.category}</p>
              <h2 className="mt-1 font-display text-base font-extrabold leading-snug text-ink">{a.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-inkmute">{a.excerpt}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-inkmute">
                <span className="font-semibold text-ink">{a.author}</span>
                <span>·</span><span><TimeAgo date={a.date} /></span>
                <span>·</span><span>{a.readingTime} min de lecture</span>
              </div>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white">
                Lire l'article
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </span>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const around = [page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages);
  const pages = Array.from(new Set([1, ...around, totalPages])).sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
      <button
        aria-label="Page précédente"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-ink active:scale-95 disabled:opacity-40"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
      </button>

      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 && <span className="text-xs text-inkmute">…</span>}
          <button
            onClick={() => onPage(p)}
            aria-current={p === page ? "page" : undefined}
            className={
              "h-10 min-w-10 rounded-full px-3 text-sm font-extrabold active:scale-95 " +
              (p === page ? "bg-blood text-white" : "border border-line bg-panel text-ink")
            }
          >
            {p}
          </button>
        </span>
      ))}

      <button
        aria-label="Page suivante"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-ink active:scale-95 disabled:opacity-40"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
      </button>
    </nav>
  );
}
