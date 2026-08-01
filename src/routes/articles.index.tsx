import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SmartImage } from "@/components/SmartImage";
import { Screen } from "@/components/Screen";
import { articlesQuery } from "@/lib/queries";
import { TimeAgo } from "@/components/TimeAgo";
import { AsyncSection, CardListSkeleton } from "@/components/Async";

export const Route = createFileRoute("/articles/")({
  component: Articles,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(articlesQuery({ perPage: 12 }));
  },
  head: () => ({
    meta: [
      { title: "Actualités — GOMA WEBRADIO" },
      { name: "description", content: "Toute l'actualité de Goma, du Nord-Kivu et de la RDC." },
      { property: "og:title", content: "Actualités — GOMA WEBRADIO" },
      { property: "og:description", content: "Les dernières informations de Goma Webradio." },
    ],
    links: [{ rel: "canonical", href: "/articles" }],
  }),
});

function Articles() {
  const articlesQ = useQuery(articlesQuery({ perPage: 12 }));
  const articles = articlesQ.data ?? [];
  return (
    <Screen title="Actualités">
      <div className="space-y-4 pt-4">
        <AsyncSection
          isPending={articlesQ.isPending}
          isError={articlesQ.isError}
          isFetching={articlesQ.isFetching}
          onRetry={() => void articlesQ.refetch()}
          errorMessage="Impossible de charger les actualités."
          skeleton={<CardListSkeleton rows={5} />}
        >
        <div className="space-y-4">
        {articles.map((a) => (
          <article key={a.id} className="overflow-hidden rounded-2xl border border-line bg-panel shadow-soft">
            <Link to="/articles/$slug" params={{ slug: a.slug }}>
              <SmartImage src={a.image} alt={a.title} className="h-48 w-full object-cover" fallbackClassName="h-48 w-full bg-brand-deep object-contain p-8" />
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
        {articles.length === 0 && <p className="text-sm text-inkmute">Aucune actualité pour le moment.</p>}
        </div>
        </AsyncSection>
      </div>
    </Screen>
  );
}
