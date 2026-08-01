import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SmartImage } from "@/components/SmartImage";
import { TilesSkeleton, ErrorRetry } from "@/components/Async";
import { LIVE_TRACK, usePlayer, type Quality } from "@/context/player";
import { prettyDuration, shareContent } from "@/lib/format";
import { useFavorites } from "@/hooks/useFavorites";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { podcastQuery } from "@/lib/queries";
import { LOGO_URL, PLAY_BG_URL, RADIO_NAME, RADIO_SLOGAN } from "@/lib/media";

export const Route = createFileRoute("/radio")({
  component: Radio,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(podcastQuery());
  },
  head: () => ({
    meta: [
      { title: "Radio en direct — GOMA WEBRADIO" },
      { name: "description", content: "Écoutez le flux live de Goma Webradio, 24h/24 depuis le Nord-Kivu." },
      { property: "og:title", content: "Radio en direct — GOMA WEBRADIO" },
      { property: "og:description", content: "Le direct de Goma Webradio, où que vous soyez." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/radio" }],
  }),
});

const qualities: Quality[] = ["Auto", "Normale", "Haute"];

function Radio() {
  const { track, playing, loading, toggle, volume, setVolume, muted, toggleMute, quality, setQuality } = usePlayer();
  const { toggle: toggleFav, isFavorite } = useFavorites();
  const nowPlaying = useNowPlaying();
  const podcastQ = useQuery(podcastQuery());
  const [toast, setToast] = useState<string | null>(null);
  const isRadio = track?.kind === "radio";
  const isLive = isRadio && playing;
  const isLoading = isRadio && loading;
  const fav = isFavorite("radio-live");

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="relative isolate min-h-screen bg-[#01142f]">
      {/* Image de fond plein écran */}
      <div className="fixed inset-0 z-0">
        <img src={PLAY_BG_URL} alt="" aria-hidden className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#01142f] via-[#01142f]/85 to-[#01142f]/35" />
      </div>

      {/* Barre supérieure */}
      <header className="relative z-10 mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-5">
        <Link
          to="/"
          aria-label="Retour à l'accueil"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur active:scale-95"
        >
          <span className="material-symbols-outlined">expand_more</span>
        </Link>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-white/90">En direct</p>
        <button
          aria-label="Partager la radio"
          onClick={async () => {
            const r = await shareContent({ title: "GOMA WEBRADIO en direct" });
            if (r === "copied") setToast("Lien copié");
            else if (r === "shared") setToast("Partagé");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur active:scale-95"
        >
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-44 pt-6">
        {/* Pochette : logo de la radio */}
        <div className="mx-auto flex aspect-square w-full max-w-[300px] items-center justify-center rounded-3xl bg-white/10 p-10 shadow-lift ring-1 ring-white/15 backdrop-blur-md">
          <img
            src={LOGO_URL}
            alt={RADIO_NAME}
            className={"h-full w-full object-contain transition-transform " + (isLive ? "animate-pulse-slow" : "")}
          />
        </div>

        <div className="mt-7 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blood px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-white">
            {nowPlaying ?? RADIO_NAME}
          </h1>
          <p className="mt-1 text-sm text-white/75">{nowPlaying ? RADIO_NAME : RADIO_SLOGAN}</p>
        </div>

        {/* Barre live */}
        <div className="mt-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div className={"h-full w-full rounded-full bg-blood " + (isLive ? "animate-pulse" : "")} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-semibold uppercase tracking-wide text-white/70">
            <span>{isLoading ? "Connexion…" : isLive ? "En direct" : "En pause"}</span>
            <span>24h/24</span>
          </div>
        </div>

        {/* Contrôles */}
        <div className="mt-7 flex items-center justify-center gap-8">
          <button
            aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
            onClick={() => {
              const added = toggleFav({
                id: "radio-live",
                kind: "podcast",
                title: RADIO_NAME,
                subtitle: "Flux radio live",
                image: LOGO_URL,
                href: "/radio",
              });
              setToast(added ? "Ajouté aux favoris" : "Retiré des favoris");
            }}
            className={"flex h-12 w-12 items-center justify-center rounded-full active:scale-95 " + (fav ? "bg-blood/25 text-blood" : "text-white/80")}
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
            <span
              className={"material-symbols-outlined " + (isLoading ? "animate-spin" : "")}
              style={{ fontSize: 44, fontVariationSettings: "'FILL' 1" }}
            >
              {isLoading ? "progress_activity" : isLive ? "pause" : "play_arrow"}
            </span>
          </button>

          <button
            aria-label={muted ? "Réactiver le son" : "Couper le son"}
            onClick={toggleMute}
            className="flex h-12 w-12 items-center justify-center rounded-full text-white/80 active:scale-95"
          >
            <span className="material-symbols-outlined">{muted ? "volume_off" : "volume_up"}</span>
          </button>
        </div>

        {/* Volume */}
        <div className="mt-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-white/70" style={{ fontSize: 20 }}>volume_down</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            aria-label="Volume"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-brand"
          />
          <span className="material-symbols-outlined text-white/70" style={{ fontSize: 20 }}>volume_up</span>
        </div>

        {/* Qualité */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/70">Qualité audio</p>
          <div className="flex gap-2">
            {qualities.map((q) => (
              <button
                key={q}
                onClick={() => { setQuality(q); setToast(`Qualité : ${q}`); }}
                className={
                  "flex-1 rounded-full px-3 py-2.5 text-xs font-bold active:scale-95 " +
                  (quality === q ? "bg-brand text-white" : "bg-white/10 text-white/85 ring-1 ring-white/20")
                }
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Podcasts récents */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-white">Podcasts récents</h2>
            <Link to="/podcasts" className="text-xs font-bold uppercase tracking-wide text-brand">
              Tout voir
            </Link>
          </div>
          {podcastQ.isPending && <TilesSkeleton count={3} />}
          {podcastQ.isError && (
            <ErrorRetry
              message="Impossible de charger les podcasts."
              onRetry={() => void podcastQ.refetch()}
              busy={podcastQ.isFetching}
            />
          )}
          {podcastQ.data && (
            <div className="space-y-3">
              {podcastQ.data.episodes.slice(0, 5).map((ep) => {
                const epPlaying = track?.id === ep.id && playing;
                return (
                  <div key={ep.id} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                    <Link to="/podcasts/$id" params={{ id: ep.id }} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                      <SmartImage src={ep.image} alt={ep.title} className="h-full w-full object-cover" />
                    </Link>
                    <Link to="/podcasts/$id" params={{ id: ep.id }} className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-bold text-white">{ep.title}</h3>
                      <p className="truncate text-xs text-white/70">{prettyDuration(ep.duration)}</p>
                    </Link>
                    <button
                      aria-label={epPlaying ? "Pause" : `Écouter ${ep.title}`}
                      onClick={() =>
                        toggle({ id: ep.id, kind: "podcast", title: ep.title, subtitle: ep.author, artwork: ep.image, src: ep.audio })
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blood text-white active:scale-95"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>
                        {epPlaying ? "pause" : "play_arrow"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 animate-fade-up rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-lift">
          {toast}
        </div>
      )}
      <BottomNav />
    </div>
  );
}
