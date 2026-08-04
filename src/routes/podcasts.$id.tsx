import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { SmartImage } from "@/components/SmartImage";
import { Screen } from "@/components/Screen";
import { podcastQuery } from "@/lib/queries";
import { usePlayer, type Track } from "@/context/player";
import { formatTime, prettyDuration, shareContent } from "@/lib/format";
import { TimeAgo } from "@/components/TimeAgo";
import { ErrorRetry, Skeleton } from "@/components/Async";
import { useFavorites } from "@/hooks/useFavorites";
import type { Episode } from "@/lib/feeds.types";

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

const RATES = [0.75, 1, 1.25, 1.5, 2];

function toTrack(ep: Episode): Track {
  return {
    id: ep.id,
    kind: "podcast",
    title: ep.title,
    subtitle: ep.author,
    artwork: ep.image,
    src: ep.audio,
  };
}

function EpisodePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const podcastQ = useQuery(podcastQuery());
  const show = podcastQ.data;
  const player = usePlayer();
  const { track, playing, loading, progress, duration, volume, muted, rate } = player;
  const { toggle: toggleFav, isFavorite } = useFavorites();

  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off");
  const [shuffle, setShuffle] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);
  const endedRef = useRef(false);

  const episodes = useMemo(() => show?.episodes ?? [], [show]);
  const index = episodes.findIndex((e) => e.id === id);
  const ep = index >= 0 ? episodes[index] : undefined;
  const isCurrent = track?.id === id;

  const goTo = (next?: Episode) => {
    if (!next) return;
    player.play(toTrack(next));
    void navigate({ to: "/podcasts/$id", params: { id: next.id } });
  };

  const pick = (dir: 1 | -1) => {
    if (!episodes.length) return undefined;
    if (shuffle) {
      const others = episodes.filter((e) => e.id !== id);
      return others[Math.floor(Math.random() * others.length)];
    }
    const next = index + dir;
    if (next < 0 || next >= episodes.length) return repeat === "all" ? episodes[dir === 1 ? 0 : episodes.length - 1] : undefined;
    return episodes[next];
  };

  // Fin de piste : répétition / lecture automatique
  useEffect(() => {
    if (!isCurrent || !duration || playing) return;
    const atEnd = duration - progress < 1.2 && progress > 0;
    if (!atEnd) { endedRef.current = false; return; }
    if (endedRef.current) return;
    endedRef.current = true;
    if (repeat === "one" && ep) {
      player.seek(0);
      player.play(toTrack(ep));
      return;
    }
    if (repeat === "all" || shuffle) goTo(pick(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurrent, duration, progress, playing, repeat, shuffle]);

  if (podcastQ.isPending) {
    return (
      <Screen title="Lecture" back>
        <div className="space-y-4 pt-4">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </Screen>
    );
  }

  if (podcastQ.isError) {
    return (
      <Screen title="Lecture" back>
        <div className="pt-6">
          <ErrorRetry message="Impossible de charger cet épisode." onRetry={() => void podcastQ.refetch()} busy={podcastQ.isFetching} />
        </div>
      </Screen>
    );
  }

  if (!ep) {
    return (
      <Screen title="Lecture" back>
        <p className="pt-10 text-sm text-inkmute">Épisode introuvable.</p>
      </Screen>
    );
  }

  const fav = isFavorite(ep.id);
  const pos = isCurrent ? (scrub ?? progress) : 0;
  const total = isCurrent && duration ? duration : 0;
  const pct = total ? Math.min(100, (pos / total) * 100) : 0;
  const isPlaying = isCurrent && playing;

  return (
    <Screen title="Lecture" back>
      <div className="pt-4">
        {/* Pochette */}
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-panel2 shadow-lift">
          <SmartImage
            src={ep.image}
            alt={ep.title}
            loading="eager"
            className={"aspect-square w-full object-cover transition-transform duration-500 " + (isPlaying ? "scale-100" : "scale-[0.98]")}
            fallbackClassName="aspect-square w-full bg-brand-deep object-contain p-12"
          />
        </div>

        {/* Titre + favoris */}
        <div className="mt-5 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-extrabold leading-tight text-ink">{ep.title}</h1>
            <p className="mt-1 truncate text-xs text-inkmute">
              {ep.author} · <TimeAgo date={ep.date} /> · {prettyDuration(ep.duration)}
            </p>
          </div>
          <button
            aria-label="Favori"
            onClick={() => toggleFav({ id: ep.id, kind: "podcast", title: ep.title, subtitle: ep.author, image: ep.image, href: `/podcasts/${ep.id}`, audio: ep.audio })}
            className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line active:scale-95 " + (fav ? "bg-blood/15 text-blood" : "bg-panel text-inkmute")}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: fav ? "'FILL' 1" : undefined }}>favorite</span>
          </button>
        </div>

        {/* Barre de progression */}
        <div className="mt-5">
          <input
            aria-label="Progression"
            type="range"
            min={0}
            max={total || 1}
            step={1}
            value={pos}
            disabled={!isCurrent || !total}
            onChange={(e) => setScrub(Number(e.target.value))}
            onMouseUp={() => { if (scrub !== null) { player.seek(scrub); setScrub(null); } }}
            onTouchEnd={() => { if (scrub !== null) { player.seek(scrub); setScrub(null); } }}
            className="gw-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-blood disabled:opacity-60"
            style={{ background: `linear-gradient(to right, var(--color-blood) ${pct}%, var(--color-line) ${pct}%)` }}
          />
          <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-inkmute">
            <span>{formatTime(pos)}</span>
            <span>{total ? formatTime(total) : prettyDuration(ep.duration)}</span>
          </div>
        </div>

        {/* Contrôles principaux */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            aria-label="Lecture aléatoire"
            onClick={() => setShuffle((s) => !s)}
            className={"flex h-11 w-11 items-center justify-center rounded-full active:scale-95 " + (shuffle ? "bg-brand/15 text-brand" : "text-inkmute")}
          >
            <span className="material-symbols-outlined">shuffle</span>
          </button>
          <button
            aria-label="Épisode précédent"
            onClick={() => goTo(pick(-1))}
            disabled={!pick(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full text-ink active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 30, fontVariationSettings: "'FILL' 1" }}>skip_previous</span>
          </button>
          <button
            aria-label="Reculer de 15 secondes"
            onClick={() => (isCurrent ? player.skip(-15) : undefined)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink active:scale-95 disabled:opacity-40"
            disabled={!isCurrent}
          >
            <span className="material-symbols-outlined">replay_10</span>
          </button>
          <button
            aria-label={isPlaying ? "Pause" : "Lecture"}
            onClick={() => player.toggle(toTrack(ep))}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-blood text-white shadow-lift active:scale-95"
          >
            <span
              className={"material-symbols-outlined " + (isCurrent && loading ? "animate-spin" : "")}
              style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}
            >
              {isCurrent && loading ? "progress_activity" : isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>
          <button
            aria-label="Avancer de 30 secondes"
            onClick={() => (isCurrent ? player.skip(30) : undefined)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink active:scale-95 disabled:opacity-40"
            disabled={!isCurrent}
          >
            <span className="material-symbols-outlined">forward_30</span>
          </button>
          <button
            aria-label="Épisode suivant"
            onClick={() => goTo(pick(1))}
            disabled={!pick(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full text-ink active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 30, fontVariationSettings: "'FILL' 1" }}>skip_next</span>
          </button>
          <button
            aria-label="Répétition"
            onClick={() => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"))}
            className={"flex h-11 w-11 items-center justify-center rounded-full active:scale-95 " + (repeat !== "off" ? "bg-brand/15 text-brand" : "text-inkmute")}
          >
            <span className="material-symbols-outlined">{repeat === "one" ? "repeat_one" : "repeat"}</span>
          </button>
        </div>

        {/* Volume + vitesse + actions */}
        <div className="mt-5 flex items-center gap-3">
          <button
            aria-label={muted ? "Réactiver le son" : "Couper le son"}
            onClick={player.toggleMute}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-inkmute active:scale-95"
          >
            <span className="material-symbols-outlined">{muted || volume === 0 ? "volume_off" : "volume_up"}</span>
          </button>
          <input
            aria-label="Volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => player.setVolume(Number(e.target.value))}
            className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full accent-brand"
            style={{ background: `linear-gradient(to right, var(--color-brand) ${(muted ? 0 : volume) * 100}%, var(--color-line) ${(muted ? 0 : volume) * 100}%)` }}
          />
          <button
            onClick={() => player.setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1)}
            className="shrink-0 rounded-full border border-line bg-panel px-3 py-2 text-xs font-extrabold text-ink active:scale-95"
          >
            {rate}×
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <DownloadButton ep={ep} />
          <button
            onClick={() => shareContent({ title: ep.title })}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-2.5 text-sm font-bold text-ink active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>share</span>
            Partager
          </button>
        </div>


        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink/90">{ep.description}</p>

        <h2 className="mt-8 font-display text-lg font-extrabold text-ink">À suivre</h2>
        <div className="mt-3 space-y-3">
          {episodes.filter((e) => e.id !== ep.id).slice(0, 8).map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 shadow-soft">
              <Link to="/podcasts/$id" params={{ id: e.id }} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-panel2">
                  <SmartImage src={e.image} alt={e.title} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-bold text-ink">{e.title}</h3>
                  <p className="mt-1 text-xs text-inkmute">{prettyDuration(e.duration)}</p>
                </div>
              </Link>
              <button
                aria-label={track?.id === e.id && playing ? "Pause" : "Lecture"}
                onClick={() => player.toggle(toTrack(e))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blood text-white active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                  {track?.id === e.id && playing ? "pause" : "play_arrow"}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
