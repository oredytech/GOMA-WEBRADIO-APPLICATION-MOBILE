import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { LIVE_TRACK, usePlayer } from "@/context/player";
import { nextShows, currentShow } from "@/lib/programs";
import { shareContent } from "@/lib/format";
import { useFavorites } from "@/hooks/useFavorites";
import playBg from "@/assets/play-bg.webp.asset.json";

export const Route = createFileRoute("/radio")({
  component: Radio,
  head: () => ({
    meta: [
      { title: "Radio en direct — GOMA WEBRADIO" },
      { name: "description", content: "Écoutez le flux live de Goma Webradio, 24h/24 depuis le Nord-Kivu." },
      { property: "og:title", content: "Radio en direct — GOMA WEBRADIO" },
      { property: "og:description", content: "Le direct de Goma Webradio, où que vous soyez." },
    ],
    links: [{ rel: "canonical", href: "/radio" }],
  }),
});

const qualities = ["Auto", "Normale", "Haute"] as const;

function Radio() {
  const { track, playing, loading, toggle, volume, setVolume, muted, toggleMute } = usePlayer();
  const { toggle: toggleFav, isFavorite } = useFavorites();
  const [quality, setQuality] = useState<(typeof qualities)[number]>("Auto");
  const [toast, setToast] = useState<string | null>(null);
  const live = currentShow();
  const isLive = track?.kind === "radio" && playing;
  const fav = isFavorite("radio-live");

  return (
    <div className="min-h-screen bg-paper">
      <div className="relative">
        <img src={playBg.url} alt="Studio Goma Webradio" className="h-[58vh] min-h-[360px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#011b40]/70 via-[#011b40]/20 to-paper" />
        <div className="absolute inset-x-0 top-0 mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link
            to="/"
            aria-label="Retour"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur active:scale-95"
          >
            <span className="material-symbols-outlined">expand_more</span>
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">Direct</p>
          <button
            aria-label="Partager"
            onClick={() => shareContent({ title: "GOMA WEBRADIO en direct" }).then((r) => setToast(r === "copied" ? "Lien copié" : null))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur active:scale-95"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </div>

      <main className="mx-auto -mt-24 w-full max-w-2xl px-4 pb-44">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-lift">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-blood px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live
            </span>
            <span className="text-xs text-inkmute">1 248 auditeurs</span>
          </div>

          <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-ink">{live.name}</h1>
          <p className="text-sm text-inkmute">Avec {live.host} · {live.description}</p>

          {/* Progress (live) */}
          <div className="mt-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel2">
              <div className={"h-full rounded-full bg-blood " + (isLive ? "animate-pulse" : "")} style={{ width: "100%" }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-inkmute">
              <span>En direct</span>
              <span>{live.time} – {live.end}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center justify-center gap-6">
            <button
              aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
              onClick={() => {
                const added = toggleFav({
                  id: "radio-live",
                  kind: "podcast",
                  title: "GOMA WEBRADIO — Direct",
                  subtitle: "Flux radio live",
                  image: playBg.url,
                  href: "/radio",
                });
                setToast(added ? "Ajouté aux favoris" : "Retiré des favoris");
              }}
              className={"flex h-12 w-12 items-center justify-center rounded-full active:scale-95 " + (fav ? "bg-blood/15 text-blood" : "text-inkmute")}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: fav ? "'FILL' 1" : undefined }}>
                favorite
              </span>
            </button>

            <button
              aria-label={isLive ? "Pause" : "Lecture"}
              onClick={() => toggle(LIVE_TRACK)}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-blood text-white shadow-lift transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 44, fontVariationSettings: "'FILL' 1" }}>
                {loading && track?.kind === "radio" ? "hourglass_empty" : isLive ? "pause" : "play_arrow"}
              </span>
            </button>

            <button
              aria-label={muted ? "Réactiver le son" : "Couper le son"}
              onClick={toggleMute}
              className="flex h-12 w-12 items-center justify-center rounded-full text-inkmute active:scale-95"
            >
              <span className="material-symbols-outlined">{muted ? "volume_off" : "volume_up"}</span>
            </button>
          </div>

          {/* Volume */}
          <div className="mt-5 flex items-center gap-3">
            <span className="material-symbols-outlined text-inkmute" style={{ fontSize: 20 }}>volume_down</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              aria-label="Volume"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-panel2 accent-brand"
            />
            <span className="material-symbols-outlined text-inkmute" style={{ fontSize: 20 }}>volume_up</span>
          </div>

          {/* Quality */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-inkmute">Qualité audio</p>
            <div className="flex gap-2">
              {qualities.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuality(q); setToast(`Qualité : ${q}`); }}
                  className={
                    "flex-1 rounded-full px-3 py-2 text-xs font-bold active:scale-95 " +
                    (quality === q ? "bg-brand text-white" : "border border-line bg-panel2 text-ink")
                  }
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="mt-7">
          <h2 className="mb-3 font-display text-lg font-extrabold text-ink">Prochaines émissions</h2>
          <div className="space-y-3">
            {nextShows().map((s) => (
              <div key={s.name} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 shadow-soft">
                <div className="w-14 shrink-0 text-center">
                  <p className="font-display text-base font-extrabold text-ink">{s.time}</p>
                  <p className="text-[11px] text-inkmute">{s.end}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-ink">{s.name}</h3>
                  <p className="truncate text-xs text-inkmute">{s.host} · {s.tag}</p>
                </div>
                <span className="material-symbols-outlined shrink-0 text-inkmute">schedule</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {toast && (
        <div
          onAnimationEnd={() => setTimeout(() => setToast(null), 1200)}
          className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 animate-fade-up rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-lift"
        >
          {toast}
        </div>
      )}
      <BottomNav />
    </div>
  );
}
