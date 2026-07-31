import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SmartImage } from "@/components/SmartImage";
import { Screen } from "@/components/Screen";
import { articleQuery } from "@/lib/queries";
import { formatDate, shareContent } from "@/lib/format";
import { useFavorites } from "@/hooks/useFavorites";

export const Route = createFileRoute("/articles/$slug")({
  component: ArticlePage,
  loader: ({ context, params }) => context.queryClient.ensureQueryData(articleQuery(params.slug)),
  head: ({ loaderData, params }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Article"} — GOMA WEBRADIO` },
      { name: "description", content: loaderData?.excerpt ?? "Actualité de Goma Webradio." },
      { property: "og:title", content: loaderData?.title ?? "Article" },
      { property: "og:description", content: loaderData?.excerpt ?? "" },
      { property: "og:type", content: "article" },
      ...(loaderData?.image
        ? [
            { property: "og:image", content: loaderData.image },
            { name: "twitter:image", content: loaderData.image },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: `/articles/${params.slug}` }],
  }),
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(slug));
  const { toggle, isFavorite } = useFavorites();

  if (!article) {
    return (
      <Screen title="Article" back>
        <p className="pt-10 text-sm text-inkmute">Article introuvable.</p>
      </Screen>
    );
  }

  const fav = isFavorite(String(article.id));

  return (
    <Screen title="Article" back>
      <article className="pt-4">
        <SmartImage src={article.image} alt={article.title} className="h-56 w-full rounded-2xl object-cover shadow-soft" fallbackClassName="h-56 w-full rounded-2xl bg-brand-deep object-contain p-10 shadow-soft" />
        <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-brand">{article.category}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight text-ink">{article.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-inkmute">
          <span className="font-semibold text-ink">{article.author}</span>
          <span>·</span><span>{formatDate(article.date)}</span>
          <span>·</span><span>{article.readingTime} min</span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => shareContent({ title: article.title, url: article.link })}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span> Partager
          </button>
          <button
            onClick={() => toggle({ id: String(article.id), kind: "article", title: article.title, subtitle: article.author, image: article.image, href: `/articles/${article.slug}` })}
            className={"inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-bold active:scale-95 " + (fav ? "bg-blood/15 text-blood" : "bg-panel text-ink")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: fav ? "'FILL' 1" : undefined }}>favorite</span>
            {fav ? "Enregistré" : "Favori"}
          </button>
        </div>

        <div className="gw-article-content mt-5 text-ink/90" dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>
    </Screen>
  );
}
