import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Screen } from "@/components/Screen";
import { articlesPageQuery, categoryQuery } from "@/lib/queries";
import { AsyncSection, CardListSkeleton } from "@/components/Async";
import { ArticleFeed, Pagination } from "@/components/ArticleFeed";
import { CategoryDrawer } from "@/components/CategoryDrawer";

type Search = { page: number };

export const Route = createFileRoute("/categories/$slug")({
  component: CategoryPage,
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = Number(search.page);
    return { page: Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1 };
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(categoryQuery(params.slug)).catch(() => null),
  head: ({ loaderData, params }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Catégorie"} — GOMA WEBRADIO` },
      {
        name: "description",
        content: `Articles de la catégorie ${loaderData?.name ?? params.slug} sur Goma Webradio.`,
      },
      { property: "og:title", content: `${loaderData?.name ?? "Catégorie"} — GOMA WEBRADIO` },
      { property: "og:description", content: "Actualités par rubrique." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `/categories/${params.slug}` }],
  }),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  const catQ = useQuery(categoryQuery(slug));
  const category = catQ.data;
  const articlesQ = useQuery({
    ...articlesPageQuery({ perPage: 10, page, categoryId: category?.id }),
    enabled: Boolean(category?.id),
  });
  const data = articlesQ.data;

  const goPage = (p: number) => {
    void navigate({ to: "/categories/$slug", params: { slug }, search: { page: p } });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Screen
      title={category?.name ?? "Catégorie"}
      back
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
      <CategoryDrawer open={menu} onClose={() => setMenu(false)} activeSlug={slug} />
      <div className="space-y-4 pt-4">
        {catQ.isSuccess && !category ? (
          <p className="pt-8 text-sm text-inkmute">Catégorie introuvable.</p>
        ) : (
          <AsyncSection
            isPending={catQ.isPending || articlesQ.isPending}
            isError={catQ.isError || articlesQ.isError}
            isFetching={articlesQ.isFetching}
            onRetry={() => {
              void catQ.refetch();
              void articlesQ.refetch();
            }}
            errorMessage="Impossible de charger cette catégorie."
            skeleton={<CardListSkeleton rows={4} />}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand">
              {data?.total ?? 0} article{(data?.total ?? 0) > 1 ? "s" : ""}
            </p>
            <ArticleFeed articles={data?.items ?? []} />
            {(data?.items.length ?? 0) === 0 && (
              <p className="text-sm text-inkmute">Aucun article dans cette rubrique.</p>
            )}
            <Pagination page={data?.page ?? page} totalPages={data?.totalPages ?? 1} onPage={goPage} />
          </AsyncSection>
        )}
      </div>
    </Screen>
  );
}
