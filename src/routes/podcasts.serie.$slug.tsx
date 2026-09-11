import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { SmartImage } from "@/components/SmartImage";
import { Screen } from "@/components/Screen";
import { podcastQuery } from "@/lib/queries";
import { AsyncSection, CardListSkeleton } from "@/components/Async";
import { EpisodeRow } from "@/components/EpisodeRow";
import { groupBySeries, seriesBySlug } from "@/lib/series";
import { usePlayer } from "@/context/player";
import { cleanEpisodeTitle } from "@/lib/series";

export const Route = createFileRoute("/podcasts/serie/$slug")({
  component: SeriePage,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(podcastQuery());
  },
  head: ({ params }) => {
    const s = seriesBySlug(params.slug);
    const title = `${s?.name ?? "Série"} — Podcasts GOMA WEBRADIO`;
    const description = s?.description ?? "Les épisodes de cette série sur Goma Webradio.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
});

function SeriePage() {
  const { slug } = Route.useParams();
  const podcastQ = useQuery(podcastQuery());
  const { toggle, track, playing } = usePlayer();

  const group = useMemo(
    () => groupBySeries(podcastQ.data?.episodes ?? []).find((g) => g.slug === slug),
    [podcastQ.data?.episodes, slug],
  );
  const def = seriesBySlug(slug);

  const first = group?.episodes[0];
  const isCurrent = !!first && track?.id === first.id && playing;

  return (
    <Screen title={def?.name ?? "Série"} back>
      <AsyncSection
        isPending={podcastQ.isPending}
        isError={podcastQ.isError}
        isFetching={podcastQ.isFetching}
        onRetry={() => void podcastQ.refetch()}
        errorMessage="Impossible de charger cette série."
        skeleton={<CardListSkeleton rows={5} />}
      >
        {!group ? (
          <div className="pt-10 text-center">
            <p className="text-sm text-inkmute">Cette série n’existe pas.</p>
            <Link to="/podcasts" className="mt-3 inline-block text-sm font-bold text-brand">
              Voir tous les podcasts
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-4 flex gap-4">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-panel2 shadow-soft">
                <SmartImage
                  src={group.image}
                  alt={group.name}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-extrabold leading-tight text-ink">
                  {group.name}
                </h1>
                <p className="mt-1 line-clamp-3 text-xs text-inkmute">{group.description}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-brand">
                  {group.episodes.length} épisodes
                </p>
                {first && (
                  <button
                    onClick={() =>
                      toggle({
                        id: first.id,
                        kind: "podcast",
                        title: cleanEpisodeTitle(first),
                        subtitle: group.name,
                        artwork: first.image,
                        src: first.audio,
                      })
                    }
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blood px-4 py-2 text-xs font-bold text-white active:scale-95"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
                    >
                      {isCurrent ? "pause" : "play_arrow"}
                    </span>
                    {isCurrent ? "Pause" : "Écouter le dernier"}
                  </button>
                )}
              </div>
            </section>

            <section className="mt-5 space-y-3">
              {group.episodes.map((ep) => (
                <EpisodeRow key={ep.id} ep={ep} />
              ))}
            </section>
          </>
        )}
      </AsyncSection>
    </Screen>
  );
}
