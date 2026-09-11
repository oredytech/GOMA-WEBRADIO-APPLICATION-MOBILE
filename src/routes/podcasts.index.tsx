import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SmartImage } from "@/components/SmartImage";
import { Screen, SectionHeader } from "@/components/Screen";
import { podcastQuery } from "@/lib/queries";
import { AsyncSection, CardListSkeleton, Skeleton } from "@/components/Async";
import { EpisodeRow } from "@/components/EpisodeRow";
import { groupBySeries } from "@/lib/series";

export const Route = createFileRoute("/podcasts/")({
  component: Podcasts,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(podcastQuery());
  },
  head: () => ({
    meta: [
      { title: "Podcasts — GOMA WEBRADIO" },
      { name: "description", content: "Reportages, magazines et émissions à la demande de Goma Webradio." },
      { property: "og:title", content: "Podcasts — GOMA WEBRADIO" },
      { property: "og:description", content: "Écoutez et téléchargez les podcasts de Goma Webradio." },
    ],
    links: [{ rel: "canonical", href: "/podcasts" }],
  }),
});

function Podcasts() {
  const podcastQ = useQuery(podcastQuery());
  const show = podcastQ.data;
  const [q, setQ] = useState("");

  const groups = useMemo(() => groupBySeries(show?.episodes ?? []), [show?.episodes]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return (show?.episodes ?? []).filter(
      (e) =>
        e.title.toLowerCase().includes(needle) || e.description.toLowerCase().includes(needle),
    );
  }, [show?.episodes, q]);

  const recent = useMemo(
    () =>
      (show?.episodes ?? [])
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [show?.episodes],
  );

  return (
    <Screen title="Podcasts">
      <div className="pt-4">
        <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-3 shadow-soft">
          <span className="material-symbols-outlined text-inkmute">search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un épisode…"
            className="w-full border-0 bg-transparent p-0 text-sm text-ink placeholder:text-inkmute focus:outline-none focus:ring-0"
          />
          {q && (
            <button aria-label="Effacer" onClick={() => setQ("")} className="text-inkmute">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          )}
        </div>
      </div>

      {q ? (
        <section className="mt-5 space-y-3">
          <SectionHeader title={`Résultats (${results.length})`} />
          {results.map((ep) => (
            <EpisodeRow key={ep.id} ep={ep} showSeries />
          ))}
          {results.length === 0 && <p className="text-sm text-inkmute">Aucun épisode trouvé.</p>}
        </section>
      ) : (
        <>
          <section className="mt-5">
            <SectionHeader title="Nos émissions" />
            <AsyncSection
              isPending={podcastQ.isPending}
              isError={podcastQ.isError}
              isFetching={podcastQ.isFetching}
              onRetry={() => void podcastQ.refetch()}
              errorMessage="Impossible de charger les podcasts."
              skeleton={
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-2xl" />
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-3">
                {groups.map((g) => (
                  <Link
                    key={g.slug}
                    to="/podcasts/serie/$slug"
                    params={{ slug: g.slug }}
                    className="overflow-hidden rounded-2xl border border-line bg-panel shadow-soft active:scale-[0.98]"
                  >
                    <div className="relative aspect-square w-full bg-panel2">
                      <SmartImage
                        src={g.image}
                        alt={g.name}
                        className="h-full w-full object-cover"
                        loading="eager"
                      />
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          {g.icon}
                        </span>
                        {g.episodes.length} ép.
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="truncate font-display text-sm font-extrabold text-ink">{g.name}</h3>
                      <p className="line-clamp-2 text-[11px] text-inkmute">{g.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </AsyncSection>
          </section>

          <section className="mt-6 space-y-3">
            <SectionHeader title="Derniers épisodes" />
            <AsyncSection
              isPending={podcastQ.isPending}
              isError={podcastQ.isError}
              isFetching={podcastQ.isFetching}
              onRetry={() => void podcastQ.refetch()}
              errorMessage="Impossible de charger les épisodes."
              skeleton={<CardListSkeleton rows={4} />}
            >
              {recent.map((ep) => (
                <EpisodeRow key={ep.id} ep={ep} showSeries />
              ))}
            </AsyncSection>
          </section>
        </>
      )}
    </Screen>
  );
}
