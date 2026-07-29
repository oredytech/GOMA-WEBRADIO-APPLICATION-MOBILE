import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useState } from "react";

export const Route = createFileRoute("/podcasts")({
  component: Podcasts,
  head: () => ({
    meta: [
      { title: "Podcasts — GOMA WEBRADIO" },
      { name: "description", content: "Explorez nos podcasts : politique, culture, musique et reportages de Goma." },
    ],
  }),
});

const CATS = ["Tout", "Politique", "Culture", "Musique", "Reportage"];
const PODS = [
  { title: "Goma Aujourd'hui", ep: "Épisode 42 : Perspectives Urbaines", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAznpO3WoRtTL3RsOTSa274dUBckk8BP2p_McG2qOg-mxHXWq0_XzSi0v4eqMU4crKJNiXXaU3SFm8IVmEwmxMNds8nrm_cZlERkee5phZvUSkgWzXRZIQpEZbv3_5PYXS8EqvSJbeZATV6bXn1r-YBkPa6QcLlTPZdTORxkMPnZDCbK8ErAoeZiVa8jWjmc_YlIEHVbx8Yi-hEz4AEYk9dreCl-4fxW8lpM3QzBlG16gan7tDcCXgOMg" },
  { title: "Goma Aujourd'hui", ep: "Les défis de la mobilité", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC83hSUFdPodPhyPsa1Z4RVjHKqzo6RclkWX8WUFCIrLl5I3-45-BbDIqcWvLxY0Oc_8saSqP9t7dc7nE2ihQIbtUd_UW6EHBngQ_oOpYaCbE0xAU-EJh03F618wOjDbKc64rA5tA9PQts9nnjxoXsSl6mEHPa4O1bUJQ6NjY3shkT7tzIOE3B0v5COjEi3PZ1E0icdVqdcAj7AC27KodQ7EmudhmPlqloDlMHfSw9ydwv9C86i4wX6Mg" },
  { title: "Goma Aujourd'hui", ep: "Spécial Culture Gomatracienne", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAp2E5La-HLGe9rvI0J7finEASsPmiKjpVVD4XshioiYz5yGXDMTHQ7Yv_ZNr2jTnTJIdUT5KcAJx9L2U2q8JuTjDTG1H3puL85KvdpEcUmJUKw_hjYE9Rrk-gujQV4p0_p9vvfIMBwNJKK35F8knUty3kJ0Lp89svBRkWuKlvoVlXwfy5jNSkC24Fnw1i7oaHDnmzMxxyBz1llfxJO4v763TvCRDSGiSuUkx6Q9Vwic4jcVzzt2iFC2Q" },
  { title: "Goma Aujourd'hui", ep: "L'innovation locale en marche", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBezes7JZN_ZBB8gCpHP2CFlPa0BxlBaXRVmx7LpntHNv16PzoHa5b-Ur6hT3bJS7V3ksZKhZpn300zcx8ibpLXLpjLPsaUEpHTavCULHNuOCP-DUf9PhsGcWlLa_jorf8mVZxLOWkI5i--3_mWN6eNtMYl__Xd1U5thn-kfTYDlWaAPiXzl4-Q8a9lnw_2CcQVjC5TR6orzjp5nNPC_lM6xMM4mnVjtX0wchyhWt3PiYjIja344ArKQw" },
];

function Podcasts() {
  const [active, setActive] = useState("Tout");
  return (
    <div className="min-h-screen bg-surface pb-40">
      <TopBar />
      <main className="pt-20 px-margin-mobile">
        <section className="mt-stack-sm mb-stack-lg">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container border-none h-12 pl-12 pr-4 rounded-full focus:ring-2 focus:ring-primary/20 font-body-md"
              placeholder="Rechercher des podcasts..."
              type="text"
            />
          </div>
        </section>

        <section className="mb-stack-xl">
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2" style={{ scrollbarWidth: "none" }}>
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={
                  "whitespace-nowrap px-6 py-2 rounded-full font-label-lg text-label-lg transition-colors " +
                  (active === c
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant")
                }
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-stack-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-headline-sm text-headline-sm">Podcasts Récents</h2>
            <button className="text-primary font-label-lg text-label-lg">Tout voir</button>
          </div>

          {PODS.map((p, i) => (
            <div key={i} className="flex gap-4 p-3 bg-surface-container-lowest rounded-lg shadow-sm hover:scale-[1.01] transition-transform">
              <div className="relative w-24 h-24 flex-shrink-0">
                <img className="w-full h-full object-cover rounded" src={p.img} alt={p.ep} />
                <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-1 shadow-md">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </div>
              </div>
              <div className="flex flex-col justify-between flex-grow">
                <div>
                  <span className="text-secondary font-label-lg text-label-lg uppercase tracking-wider">News</span>
                  <h3 className="font-title-lg text-title-lg text-on-surface leading-tight mt-1">{p.title}</h3>
                  <p className="text-on-surface-muted font-body-md text-body-md mt-1">{p.ep}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                    <span className="font-label-lg text-label-lg">15 min</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-primary">
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant">
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}
