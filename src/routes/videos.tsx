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
  const [current, setCurrent] = useState<Video | null>(null);
  const videos = videosQ.data ?? [];

  return (
    <Screen title="Vidéos">
      <section className="mt-4 space-y-4">
        <AsyncSection
          isPending={videosQ.isPending}
          isError={videosQ.isError}
          isFetching={videosQ.isFetching}
          onRetry={() => void videosQ.refetch()}
          errorMessage="Impossible de charger les vidéos."
          skeleton={<CardListSkeleton rows={4} />}
        >
          {videos.map((v, i) => (
            <article
              key={v.id}
              className="overflow-hidden rounded-2xl border border-line bg-panel shadow-soft"
            >
              <button
                onClick={() => setCurrent(v)}
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
                {i === 0 && (
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
                    onClick={() => setCurrent(v)}
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

      {current && <VideoPlayer video={current} onClose={() => setCurrent(null)} />}
    </Screen>
  );
}

function VideoPlayer({ video, onClose }: { video: Video; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <p className="line-clamp-1 flex-1 text-sm font-bold text-white">{video.title}</p>
        <button
          aria-label="Fermer la vidéo"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white active:scale-95"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-3 pb-8">
        <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-lift">
          <iframe
            key={video.id}
            title={video.title}
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
