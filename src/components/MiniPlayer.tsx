import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePlayer, type Track } from "@/context/player";
import { LOGO_URL } from "@/lib/media";
import { podcastQuery } from "@/lib/queries";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { Marquee } from "@/components/Marquee";
import type { Episode } from "@/lib/feeds.types";

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

export function MiniPlayer() {
  const { track, playing, loading, toggle, stop, setQueue, playNext, playPrev, hasNext, hasPrev } = usePlayer();
  const { pathname } = useLocation();
  const isPodcast = track?.kind === "podcast";
  const { data: show } = useQuery({ ...podcastQuery(), enabled: isPodcast });
  const { title: nowTitle } = useNowPlaying();

  // File d'écoute globale : permet de changer d'épisode depuis n'importe quel écran
  useEffect(() => {
    if (!show?.episodes?.length) return;
    setQueue(show.episodes.map(toTrack));
  }, [show, setQueue]);

  if (!track || pathname === "/radio") return null;
  if (isPodcast && pathname === `/podcasts/${track.id}`) return null;

  const subtitle = track.kind === "radio" ? (nowTitle ?? track.subtitle) : track.subtitle;

  return (
    <div className="fixed bottom-[calc(68px+4px+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4">
      <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-line bg-panel/95 p-2 pr-2.5 shadow-lift backdrop-blur-xl">
        {isPodcast ? (
          <Link
            to="/podcasts/$id"
            params={{ id: track.id }}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <Artwork track={track} />
            <Meta track={track} subtitle={subtitle} />
          </Link>
        ) : (
          <Link to="/radio" className="flex min-w-0 flex-1 items-center gap-3">
            <Artwork track={track} />
            <Meta track={track} subtitle={subtitle} />
          </Link>
        )}

        {isPodcast && (
          <button
            aria-label="Épisode précédent"
            onClick={() => playPrev()}
            disabled={!hasPrev}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink active:scale-95 disabled:opacity-30"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>
              skip_previous
            </span>
          </button>
        )}

        <button
          aria-label={playing ? "Pause" : "Lecture"}
          onClick={() => toggle()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blood text-white shadow-soft active:scale-95"
        >
          <span
            className={"material-symbols-outlined " + (loading ? "animate-spin" : "")}
            style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}
          >
            {loading ? "progress_activity" : playing ? "pause" : "play_arrow"}
          </span>
        </button>

        {isPodcast && (
          <button
            aria-label="Épisode suivant"
            onClick={() => playNext()}
            disabled={!hasNext}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink active:scale-95 disabled:opacity-30"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>
              skip_next
            </span>
          </button>
        )}

        <button
          aria-label="Fermer le lecteur"
          onClick={stop}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-inkmute active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
        </button>
      </div>
    </div>
  );
}

function Artwork({ track }: { track: Track }) {
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-deep">
      <img
        alt="GOMA WEBRADIO"
        src={track.artwork ?? LOGO_URL}
        className={track.artwork ? "h-full w-full object-cover" : "h-full w-full object-contain p-1.5"}
      />
      {track.kind === "radio" && (
        <span className="absolute bottom-0 left-0 right-0 bg-blood py-[1px] text-center text-[8px] font-bold text-white">
          LIVE
        </span>
      )}
    </div>
  );
}

function Meta({ track, subtitle }: { track: Track; subtitle: string }) {
  return (
    <div className="min-w-0 flex-1">
      <Marquee text={track.title} className="font-display text-sm font-bold text-ink" />
      <Marquee text={subtitle} className="text-xs text-inkmute" />
    </div>
  );
}
