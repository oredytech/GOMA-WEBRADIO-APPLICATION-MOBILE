import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useState } from "react";

export const Route = createFileRoute("/radio")({
  component: Radio,
  head: () => ({
    meta: [
      { title: "Radio en direct — GOMA WEBRADIO" },
      { name: "description", content: "Écoutez la matinale et les émissions de Goma Webradio en direct." },
    ],
  }),
});

function Radio() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      <TopBar transparent />
      <main className="min-h-screen pb-32">
        <section className="relative min-h-[calc(100vh-96px)] w-full flex flex-col justify-end p-margin-mobile">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent z-10" />
            <div
              className="w-full h-full bg-cover bg-center scale-110"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDt2zL2sdazeXkK0LZUK_FQNFCKqJhJsFrhbcujqu2DdzQG_Ip1npgUOTjS0ytEwPM2n86gv_a6JPq2S2dbns7zbhPmjDvZDzjJCIpCYslI6AYtoNAgF0Gu5EcmXVLK1iOWzhx-wDmCZroKFsilZ5TI752K082Ww0mVf1hruN7ujpSN5sEH5xGmnUjj3H5sciBfafhFp0MooVGRQIRO8t5brk9W1M3zIWXH4Qk8QIivL2OUyBccoCKRDQ')",
              }}
            />
          </div>

          <div className="relative z-20 mb-stack-xl flex flex-col items-center text-center">
            <div className="flex items-center gap-stack-sm mb-stack-sm">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-primary font-bold uppercase tracking-widest text-label-lg">
                EN DIRECT DE GOMA
              </span>
            </div>
            <h2 className="font-display-lg text-display-lg leading-tight text-on-background mb-stack-xs">
              La Matinale de l'Est
            </h2>
            <p className="text-on-surface-variant font-body-lg italic">
              Avec Patrick Kasindi • Actualités &amp; Musique
            </p>
          </div>

          <div className="relative z-20 flex flex-col items-center gap-stack-xl">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping pointer-events-none" />
              <button
                onClick={() => setPlaying((p) => !p)}
                className="relative z-10 w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 hover:scale-105"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}>
                  {playing ? "pause" : "play_arrow"}
                </span>
              </button>
            </div>

            <div className="w-full max-w-md">
              <div className="flex justify-between text-label-lg text-on-surface-variant mb-stack-sm px-1">
                <span>LIVE</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> 1.2k Auditeurs
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full relative" style={{ width: "85%" }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary border-2 border-surface rounded-full shadow-md" />
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm flex justify-between items-center px-gutter-md py-stack-md rounded-lg bg-white/60 backdrop-blur-md border border-outline-variant/40">
              <button className="p-2 text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">favorite</span>
              </button>
              <div className="flex items-center gap-stack-sm flex-1 mx-stack-lg">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>volume_down</span>
                <input
                  className="w-full accent-primary h-1 bg-surface-container-highest rounded-full appearance-none cursor-pointer"
                  max={100} min={0} type="range" defaultValue={70}
                />
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>volume_up</span>
              </div>
              <button className="p-2 text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>
        </section>

        <section className="px-margin-mobile mt-stack-xl">
          <div className="flex justify-between items-center mb-stack-md">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Prochaines émissions</h3>
            <a className="text-primary font-label-lg hover:underline uppercase" href="#">Voir tout</a>
          </div>
          <div className="space-y-stack-md">
            {[
              { t: "12:00", p: "MIDI", n: "Echo des Volcans", d: "Magazine Environnement" },
              { t: "14:30", p: "PM", n: "Goma Rythmes", d: "Rumba & Afrobeats" },
              { t: "17:00", p: "PM", n: "Le Grand Journal", d: "Édition du soir" },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-stack-md p-stack-md bg-surface-container hover:bg-surface-container-high rounded-lg cursor-pointer transition-colors">
                <div className="text-center min-w-[60px]">
                  <p className="font-bold text-on-surface">{s.t}</p>
                  <p className="text-label-lg text-on-surface-variant">{s.p}</p>
                </div>
                <div className="flex-1">
                  <h4 className="font-title-lg text-title-lg text-on-surface">{s.n}</h4>
                  <p className="text-body-md text-on-surface-variant">{s.d}</p>
                </div>
                <span className="material-symbols-outlined text-outline">more_vert</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
