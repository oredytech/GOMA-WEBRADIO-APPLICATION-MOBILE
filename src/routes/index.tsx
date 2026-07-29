import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Accueil — GOMA WEBRADIO" },
      { name: "description", content: "Radio en direct, podcasts récents et dernières actualités depuis Goma." },
    ],
  }),
});

function Home() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="min-h-screen bg-surface">
      <TopBar />
      <main className="pt-16 pb-40">
        {/* Live hero */}
        <section className="px-margin-mobile pt-stack-md">
          <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden shadow-lg group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCdj70k9ONpzVKFDp207zpqJmAQ8uHAPSlbl_-iTvLcdK4XmerX0gpTg9wlKr__MlTbjCQ0trBEy2Zxh65spI3TVNNOQEB7tROMSBIgRkJ2yptR1uHEhJlTMRwFqQKN30sQUR4SfBpQ_UvuIEydZCdLp7_JH7npFJfr5BDO0DSi3uZLJRRuz6rX7nMe5PJA8YPWB7KwRMfsqCe9LKC2Vqy4CEqksti62RGZ365SGmSNgm-wjR1Ph80Q4Q')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-stack-lg space-y-stack-sm">
              <div className="inline-flex items-center px-3 py-1 bg-radio-live-red text-white rounded-full font-label-lg text-label-lg uppercase animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full mr-2" />
                EN DIRECT
              </div>
              <div>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-white leading-none">Le Grand Réveil</h2>
                <p className="font-title-lg text-title-lg text-secondary-container mt-1">Avec Mama Goma</p>
              </div>
              <div className="flex items-center justify-between pt-stack-md">
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="w-16 h-16 flex items-center justify-center bg-primary text-white rounded-full shadow-xl active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
                    {playing ? "pause" : "play_arrow"}
                  </span>
                </button>
                <div className="flex gap-stack-md">
                  <button className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-full">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-full">
                    <span className="material-symbols-outlined">favorite</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Podcasts récents */}
        <section className="mt-stack-xl">
          <div className="px-margin-mobile flex justify-between items-center mb-stack-md">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Podcasts récents</h3>
            <button className="text-primary font-label-lg text-label-lg">VOIR TOUT</button>
          </div>
          <div className="flex overflow-x-auto gap-stack-md px-margin-mobile pb-stack-sm" style={{ scrollbarWidth: "none" }}>
            {[
              {
                cat: "SOCIÉTÉ",
                title: "L'avenir de Goma",
                mins: "24 min",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBOoxg0RyTIRMdSFscHwMscaSVFz4jOz6iY_K3ZU7Vj-DGIrB79gD-oChSyCjVK-Ds7A5Cmrmx_qoLRIqq5wfhnnbVzzL0OKlNrd-VXucvCwGThoxPoI36uNihbn_lDhV1vbepo9bEXucc02IjLvCkgZNs9DX9NpRZF2HKYbDVI1-pR7sf7Qzc2Td6tvcQUkCQbtr_cz0yk4VKrySlYsnNaWQXlJ4MgLrmRZuoyo7lLP_aTmWu9n-IHg",
              },
              {
                cat: "ÉCONOMIE",
                title: "Startups au Kivu",
                mins: "18 min",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDh7FmNxVe2unmbhZhvFPf1hKK8vIE82FIaV3FVCx3SzmBtUYI8f6HKvzRaCIAZF0nS5pJrPcPZWYqXf1PWBaSzVDjCL-ng-5UjR4298om2gyUcHFDFGf9XR_KGF4sDB4BdiPhc7Hy3EBWjeb0di56jpv_LOT83XV87sl9Rn_I1HlaUB4B7uMR12q3JO8bmcSN8VE6OudO8iW_afNA9NUHga-iMNlid-8TFowCiqV0094WCARjuTe1GNw",
              },
              {
                cat: "CULTURE",
                title: "Rythmes du Volcan",
                mins: "42 min",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAswXwko8yrImiNyLSLmCeiHaKckFOWyd8VqAGv3n2EduH2q1UXr7WAqXn_TXERnIdkXoTLZj8RQmDTo2koAdYiwwN1fJE62Fo2jShztfxKENWlfwhUyE3aAjMhrfIiyrEv5OzUBOvCA-yD6_xcLncLtmDukg2wwLkBJXtYDbj5khq32If4iCD28st67AQDXkikVb5CEqFvhncTLbSV86QhnB8gF_6LPZ-5xSQ7FTJCKE6Az3Keu5WqDw",
              },
            ].map((p) => (
              <div key={p.title} className="flex-none w-64 bg-surface-container rounded-lg p-stack-sm shadow-sm">
                <div className="w-full aspect-square rounded-lg bg-cover bg-center mb-stack-sm" style={{ backgroundImage: `url('${p.img}')` }} />
                <p className="font-label-lg text-label-lg text-secondary uppercase">{p.cat}</p>
                <h4 className="font-title-lg text-title-lg text-on-surface line-clamp-1">{p.title}</h4>
                <div className="flex items-center text-on-surface-variant text-sm mt-1">
                  <span className="material-symbols-outlined mr-1" style={{ fontSize: 16 }}>schedule</span>
                  <span className="font-body-md text-body-md">{p.mins}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular banner */}
        <section className="px-margin-mobile mt-stack-xl">
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-primary shadow-lg flex items-center">
            <div className="relative z-10 flex items-center px-stack-lg justify-between w-full">
              <div>
                <p className="font-label-lg text-label-lg text-white/70 uppercase">Émission Populaire</p>
                <h3 className="font-headline-sm text-headline-sm text-white">Focus Nord-Kivu</h3>
              </div>
              <button className="bg-secondary-container text-on-secondary-container px-stack-md py-2 rounded-full font-label-lg text-label-lg uppercase shadow-md active:scale-95 transition-transform">
                ÉCOUTER
              </button>
            </div>
          </div>
        </section>

        {/* Dernières actualités */}
        <section className="mt-stack-xl px-margin-mobile">
          <div className="flex justify-between items-center mb-stack-md">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Dernières actualités</h3>
            <button className="text-primary font-label-lg text-label-lg">PLUS D'INFOS</button>
          </div>
          <div className="space-y-stack-lg">
            {[
              {
                cat: "REGIONAL",
                title: "Nouveaux projets d'infrastructure à Goma : ce qu'il faut savoir.",
                desc: "La mairie de Goma a annoncé ce matin le lancement de trois nouveaux chantiers majeurs pour améliorer la fluidité du trafic urbain...",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoUTGIb0DUOJkj8cKrma5kA1ZJ0nBTdQ8hOUTyUtXVwfBCKBgsxmJorlwt9cVGtMvW7t5YpMqAxbVIaCQmKooK3-QviQ_25OAT0K0ExeAdMy6X_5U48bMZAgQXFr6auxESIzls3EpEKJgzA-_cV9mBZoOxhpFgADXcblWqXKElaDSnb47CkRoQFEOPxen7xiAlgbG4JFplGhpLz_2auZYBJOS4PUHwNNNhV3u7CyjaWwTv0rMmufPT8g",
              },
              {
                cat: "TOURISME",
                title: "Lake Kivu : un potentiel touristique en pleine renaissance.",
                desc: "Le secteur hôtelier de la province connaît une croissance de 15% par rapport à l'année dernière, portée par une nouvelle clientèle internationale...",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdisSQ9EWfCXxWS3NdT_x60J54h623CKTk6T2nuS261t7troTebgn9EXYQzXx_-ADH6zaVH0JMxVU5UwqP6lBtBvBSWCV55D4HJZD7EXcJBrjckkwNRY-h6NE9qU5fAUlhk2YtHShn5klmhhKu0VivbOX0_WkZEXs3sohokNRMZoGniC3_eiXeT2rMP6OuaXBXMupwNoEKh72Vqmk_SusVXJkUQdQ4NEsvOKA1nEaFLI_yUD7z-87aGA",
              },
            ].map((n) => (
              <div key={n.title} className="flex flex-col gap-stack-sm bg-white rounded-lg p-3 shadow-sm border border-outline-variant/20">
                <div className="w-full h-48 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url('${n.img}')` }} />
                <div className="py-1">
                  <span className="text-secondary font-label-lg text-label-lg uppercase tracking-wider">{n.cat}</span>
                  <h4 className="font-title-lg text-title-lg text-on-surface mt-1 leading-snug">{n.title}</h4>
                  <p className="text-on-surface-variant font-body-md text-body-md mt-2 line-clamp-2">{n.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}
