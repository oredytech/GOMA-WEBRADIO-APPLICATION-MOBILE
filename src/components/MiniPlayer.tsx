import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usePlayer, type Track } from "@/context/player";
import { LOGO_URL } from "@/lib/media";
import { podcastQuery } from "@/lib/queries";
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
  const { track, playing, loading, toggle, stop, play } = usePlayer();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isPodcast = track?.kind === "podcast";
  const { data: show } = useQuery({ ...podcastQuery(), enabled: isPodcast });

  if (!track || pathname === "/radio") return null;
  if (isPodcast && pathname === `/podcasts/${track.id}`) return null;

  const episodes = show?.episodes ?? [];
  const index = isPodcast ? episodes.findIndex((e) => e.id === track.id) : -1;
  const prev = index > 0 ? episodes[index - 1] : undefined;
  const next = index >= 0 && index < episodes.length - 1 ? episodes[index + 1] : undefined;

  const goTo = (ep?: Episode) => {
    if (!ep) return;
    play(toTrack(ep));
    void navigate({ to: "/podcasts/$id", params: { id: ep.id } });
  };

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
            <Meta track={track} />
          </Link>
        ) : (
          <Link to="/radio" className="flex min-w-0 flex-1 items-center gap-3">
            <Artwork track={track} />
            <Meta track={track} />
          </Link>
        )}

        {isPodcast && (
          <button
            aria-label="Épisode précédent"
            onClick={() => goTo(prev)}
            disabled={!prev}
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
            onClick={() => goTo(next)}
            disabled={!next}
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

function Meta({ track }: { track: Track }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate font-display text-sm font-bold text-ink">{track.title}</p>
      <p className="truncate text-xs text-inkmute">{track.subtitle}</p>
    </div>
  );
}
