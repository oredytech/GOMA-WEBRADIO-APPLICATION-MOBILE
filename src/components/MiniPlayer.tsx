import { Link, useLocation } from "@tanstack/react-router";
import { usePlayer } from "@/context/player";
import { LOGO_URL } from "@/lib/media";

export function MiniPlayer() {
  const { track, playing, loading, toggle, stop } = usePlayer();
  const { pathname } = useLocation();
  if (!track || pathname === "/radio") return null;

  const href = track.kind === "radio" ? "/radio" : "/podcasts";

  return (
    <div className="fixed bottom-[calc(68px+4px+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4">
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-line bg-panel/95 p-2 pr-3 shadow-lift backdrop-blur-xl">
        <Link to={href} className="flex min-w-0 flex-1 items-center gap-3">
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
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-ink">{track.title}</p>
            <p className="truncate text-xs text-inkmute">{track.subtitle}</p>
          </div>
        </Link>
        <button
          aria-label={playing ? "Pause" : "Lecture"}
          onClick={() => toggle()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blood text-white shadow-soft active:scale-95"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}
          >
            {loading ? "hourglass_empty" : playing ? "pause" : "play_arrow"}
          </span>
        </button>
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
