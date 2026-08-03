import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Screen } from "@/components/Screen";
import { articlesPageQuery } from "@/lib/queries";
import { AsyncSection, CardListSkeleton } from "@/components/Async";
import { ArticleFeed, Pagination } from "@/components/ArticleFeed";
import { CategoryDrawer } from "@/components/CategoryDrawer";

type Search = { page: number };

export const Route = createFileRoute("/articles/")({
  component: Articles,
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = Number(search.page);
    return { page: Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1 };
  },
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(articlesPageQuery({ perPage: 10, page: deps.page }));
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
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const articlesQ = useQuery(articlesPageQuery({ perPage: 10, page }));
  const data = articlesQ.data;

  const goPage = (p: number) => {
    void navigate({ to: "/articles", search: { page: p } });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Screen
      title="Actualités"
      action={
        <button
          aria-label="Catégories"
          onClick={() => setMenu(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink active:scale-95"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      }
    >
      <CategoryDrawer open={menu} onClose={() => setMenu(false)} />
      <div className="space-y-4 pt-4">
        <AsyncSection
          isPending={articlesQ.isPending}
          isError={articlesQ.isError}
          isFetching={articlesQ.isFetching}
          onRetry={() => void articlesQ.refetch()}
          errorMessage="Impossible de charger les actualités."
          skeleton={<CardListSkeleton rows={5} />}
        >
          <ArticleFeed articles={data?.items ?? []} />
          {(data?.items.length ?? 0) === 0 && (
            <p className="text-sm text-inkmute">Aucune actualité pour le moment.</p>
          )}
          <Pagination page={data?.page ?? page} totalPages={data?.totalPages ?? 1} onPage={goPage} />
        </AsyncSection>
      </div>
    </Screen>
  );
}
