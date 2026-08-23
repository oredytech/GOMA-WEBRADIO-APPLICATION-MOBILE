import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Screen } from "@/components/Screen";
import { SmartImage } from "@/components/SmartImage";
import { AsyncSection, CardListSkeleton } from "@/components/Async";
import { TimeAgo } from "@/components/TimeAgo";
import { videosQuery } from "@/lib/queries";
import { shareContent } from "@/lib/format";
import type { Video } from "@/lib/feeds.types";

export const Route = createFileRoute("/videos")({
  component: Videos,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(videosQuery());
  },
  head: () => ({
    meta: [
      { title: "Vidéos — GOMA WEBRADIO" },
      { name: "description", content: "Reportages, magazines et émissions filmées de Goma Webradio, à regarder dans l'application." },
      { property: "og:title", content: "Vidéos — GOMA WEBRADIO" },
      { property: "og:description", content: "Toutes les vidéos de Goma Webradio en lecture directe." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/videos" }],
  }),
});

function formatViews(v: number | null) {
  if (v === null) return null;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)} M vues`;
  if (v >= 1000) return `${Math.round(v / 1000)} k vues`;
  return `${v} vues`;
}

function Videos() {
  const videosQ = useQuery(videosQuery());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const videos = videosQ.data ?? [];
  const current = videos.find((v) => v.id === currentId) ?? null;
  const others = current ? videos.filter((v) => v.id !== current.id) : videos;

  const play = (v: Video) => {
    setCurrentId(v.id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Screen title="Vidéos">
      {current && (
        <section className="-mx-4 mb-4 bg-ink/95 pb-4 pt-3">
          <div className="px-4">
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lift">
              <iframe
                key={current.id}
                title={current.title}
                src={`https://www.youtube-nocookie.com/embed/${current.id}?autoplay=1&playsinline=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
            <div className="mt-3 flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 font-display text-sm font-extrabold leading-snug text-white">
                  {current.title}
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  <TimeAgo date={current.date} />
                  {formatViews(current.views) ? ` · ${formatViews(current.views)}` : ""}
                </p>
              </div>
              <button
                aria-label="Partager la vidéo"
                onClick={() => void shareContent({ title: current.title, url: current.url })}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>share</span>
              </button>
              <button
                aria-label="Fermer la vidéo"
                onClick={() => setCurrentId(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
          </div>
        </section>
      )}

      <section className={current ? "space-y-4" : "mt-4 space-y-4"}>
        {current && (
          <h3 className="font-display text-sm font-extrabold text-ink">Autres vidéos</h3>
        )}
        <AsyncSection
          isPending={videosQ.isPending}
          isError={videosQ.isError}
          isFetching={videosQ.isFetching}
          onRetry={() => void videosQ.refetch()}
          errorMessage="Impossible de charger les vidéos."
          skeleton={<CardListSkeleton rows={4} />}
        >
          {others.map((v, i) => (
            <article
              key={v.id}
              className="overflow-hidden rounded-2xl border border-line bg-panel shadow-soft"
            >
              <button
                onClick={() => play(v)}
                aria-label={`Regarder ${v.title}`}
                className="relative block w-full active:scale-[0.99]"
              >
                <div className="aspect-video w-full bg-panel2">
                  <SmartImage
                    src={v.thumbnail}
                    alt={v.title}
                    className="h-full w-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                </div>
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blood text-white shadow-lift">
                    <span className="material-symbols-outlined" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </span>
                </span>
                {!current && i === 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-blood px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                    Nouveau
                  </span>
                )}
              </button>
              <div className="p-3">
                <h2 className="line-clamp-2 text-sm font-bold leading-snug text-ink">{v.title}</h2>
                <p className="mt-1 text-xs text-inkmute">
                  <TimeAgo date={v.date} />
                  {formatViews(v.views) ? ` · ${formatViews(v.views)}` : ""}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => play(v)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blood px-3 py-1.5 text-xs font-bold text-white active:scale-95"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                    Regarder
                  </button>
                  <button
                    onClick={() => void shareContent({ title: v.title, url: v.url })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink active:scale-95"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
                    Partager
                  </button>
                </div>
              </div>
            </article>
          ))}
          {videos.length === 0 && <p className="text-sm text-inkmute">Aucune vidéo disponible.</p>}
        </AsyncSection>
      </section>
    </Screen>
  );
}

