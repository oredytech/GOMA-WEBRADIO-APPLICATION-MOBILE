import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SmartImage } from "@/components/SmartImage";
import { Screen } from "@/components/Screen";
import { podcastQuery } from "@/lib/queries";
import { usePlayer } from "@/context/player";
import { prettyDuration, shareContent } from "@/lib/format";
import { TimeAgo } from "@/components/TimeAgo";
import { ErrorRetry, Skeleton } from "@/components/Async";
import { useFavorites } from "@/hooks/useFavorites";

export const Route = createFileRoute("/podcasts/$id")({
  component: EpisodePage,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(podcastQuery());
  },
  head: () => ({
    meta: [
      { title: "Épisode — Podcasts GOMA WEBRADIO" },
      { name: "description", content: "Écoutez cet épisode des podcasts de Goma Webradio." },
      { property: "og:title", content: "Épisode — Podcasts GOMA WEBRADIO" },
      { property: "og:description", content: "Reportages et magazines à la demande." },
    ],
  }),
});

function EpisodePage() {
  const { id } = Route.useParams();
  const podcastQ = useQuery(podcastQuery());
  const show = podcastQ.data;
  const { track, playing, toggle } = usePlayer();
  const { toggle: toggleFav, isFavorite } = useFavorites();
  const ep = show?.episodes.find((e) => e.id === id);

  if (podcastQ.isPending) {
    return (
      <Screen title="Épisode" back>
        <div className="space-y-4 pt-4">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </Screen>
    );
  }

  if (podcastQ.isError) {
    return (
      <Screen title="Épisode" back>
        <div className="pt-6">
          <ErrorRetry
            message="Impossible de charger cet épisode."
            onRetry={() => void podcastQ.refetch()}
            busy={podcastQ.isFetching}
          />
        </div>
      </Screen>
    );
  }

  if (!ep) {
    return (
      <Screen title="Épisode" back>
        <p className="pt-10 text-sm text-inkmute">Épisode introuvable.</p>
      </Screen>
    );
  }

  const isCurrent = track?.id === ep.id && playing;
  const fav = isFavorite(ep.id);

  return (
    <Screen title="Épisode" back>
      <div className="pt-4">
        <div className="overflow-hidden rounded-2xl bg-panel2 shadow-lift">
          <SmartImage src={ep.image} alt={ep.title} className="aspect-square w-full object-cover" loading="eager" fallbackClassName="aspect-square w-full bg-brand-deep object-contain p-12" />
        </div>
        <h1 className="mt-4 font-display text-xl font-extrabold leading-tight text-ink">{ep.title}</h1>
        <p className="mt-1 text-xs text-inkmute">
          {ep.author} · <TimeAgo date={ep.date} /> · {prettyDuration(ep.duration)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => toggle({ id: ep.id, kind: "podcast", title: ep.title, subtitle: ep.author, artwork: ep.image, src: ep.audio })}
            className="inline-flex items-center gap-2 rounded-full bg-blood px-5 py-3 text-sm font-bold text-white shadow-soft active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
              {isCurrent ? "pause" : "play_arrow"}
            </span>
            {isCurrent ? "Pause" : "Lecture"}
          </button>
          <a href={ep.audio} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-3 text-sm font-bold text-ink active:scale-95">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
            Télécharger
          </a>
          <button
            aria-label="Favori"
            onClick={() => toggleFav({ id: ep.id, kind: "podcast", title: ep.title, subtitle: ep.author, image: ep.image, href: `/podcasts/${ep.id}`, audio: ep.audio })}
            className={"flex h-12 w-12 items-center justify-center rounded-full border border-line active:scale-95 " + (fav ? "bg-blood/15 text-blood" : "bg-panel text-inkmute")}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: fav ? "'FILL' 1" : undefined }}>favorite</span>
          </button>
          <button
            aria-label="Partager"
            onClick={() => shareContent({ title: ep.title })}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-panel text-inkmute active:scale-95"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>

        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink/90">{ep.description}</p>

        <h2 className="mt-8 font-display text-lg font-extrabold text-ink">Épisodes similaires</h2>
        <div className="mt-3 space-y-3">
          {(show?.episodes ?? []).filter((e) => e.id !== ep.id).slice(0, 6).map((e) => (
            <Link key={e.id} to="/podcasts/$id" params={{ id: e.id }} className="flex gap-3 rounded-2xl border border-line bg-panel p-3 shadow-soft active:scale-[0.99]">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-panel2">
                <SmartImage src={e.image} alt={e.title} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-bold text-ink">{e.title}</h3>
                <p className="mt-1 text-xs text-inkmute">{prettyDuration(e.duration)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Screen>
  );
}
