import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";

export const Route = createFileRoute("/articles")({
  component: Articles,
  head: () => ({
    meta: [
      { title: "Actualités — GOMA WEBRADIO" },
      { name: "description", content: "Articles et actualités du Nord-Kivu : urbanisme, culture, économie." },
    ],
  }),
});

const ARTICLES = [
  {
    cat: "URBANISME",
    title: "Reconstruction de Goma : Les avancées",
    desc: "Les projets d'infrastructure transforment le visage de la ville. Découvrez comment les nouvelles routes et les espaces publics améliorent la vie quotidienne des habitants de Goma.",
    initials: "JP", name: "Jean-Paul K.", date: "12 Oct 2023 • 5 min",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCq46wsHIffjmBXLy0zmDcl4N39f1TpfyhhoTfgw0fJW4t_hTidz3TpP8Fh2HayBWaqWZej8AMfgzIspxZfqKkgAQdiFjIranvh3hKijRPC1TPjKvhMHsJsPlKKlHSgfaudUdBuBG76dpO67H8O-HfTnAj--6SRUnxVfBitm4u83pk5O-rJ1jEulzNoqJjT2TUydMc_25OArCQqHVZ7Xp_7jhpJ5UBZmiKuPQbdnLpeTq9jmlBNn0Tnog",
  },
  {
    cat: "CULTURE",
    title: "Festival Amani : La Paix en Musique",
    desc: "Retour sur les moments forts de l'édition 2023. Une célébration de la résilience et du talent artistique local qui rassemble des milliers de festivaliers chaque année.",
    initials: "MS", name: "Marie-Stella N.", date: "10 Oct 2023 • 8 min",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_EAUzfFY8bnI3wxtsBxIm9Z0hK6jMK0_L55ReucaE3NOL4pqkxLMY5OOr0K-AvZvRz89i50GGT3PvhynaWvzPkV0g6R6KlcO9mXKA-UXqO03Y7RNINB07dxd_L4lHcpzY2qobSSxAkgrmcXUEpmZHapY-6SXKimIYjO7ry7oekbqCU9wugiNkwvucYoDxA5zJMKBujdFgbvYs01YyHkij5cAaBU1rgJpYe7AP5r10WosrtBFly2Saag",
  },
  {
    cat: "ECONOMIE",
    title: "L'or vert du Kivu : Le Café s'exporte",
    desc: "L'industrie du café dans le Nord-Kivu connaît un essor sans précédent. Les coopératives locales s'allient pour conquérir le marché international avec des grains d'exception.",
    initials: "BK", name: "Blaise K.", date: "08 Oct 2023 • 6 min",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuATfKtsu5Y77zVrxM8NfMHTAtGbauE5pKEGW0XBpkJcpUX5XXKXTRgIcfiWlQVAVaS-Smpj6gwAgFBNZBRwL_0mjBdYm-JUKC--BXXx7CfYN7mjNokODsdjsucixtjmNroOIjeM3A2XEqVPx0HkDM_mJfzSPyg4kSeoQavy0LT3W9wEFNQ9IKnF_lg5mdIOEkdL3WB0XcJ0my5jF6QWWpBGHTKa_KUvMrKuyQ_gDwU2DqhcvqUGyLsaNg",
  },
];

function Articles() {
  return (
    <div className="min-h-screen bg-surface pb-40">
      <TopBar />
      <main className="pt-20 px-margin-mobile">
        <div className="flex justify-between items-end mb-stack-lg">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Actualités</h2>
          <button className="text-primary font-label-lg text-label-lg flex items-center gap-1">
            FILTRER <span className="material-symbols-outlined" style={{ fontSize: 18 }}>filter_list</span>
          </button>
        </div>

        <div className="flex flex-col gap-stack-xl">
          {ARTICLES.map((a) => (
            <article key={a.title} className="bg-surface-container-lowest rounded-lg shadow-md overflow-hidden group transition-all hover:scale-[1.01]">
              <div className="relative w-full aspect-video">
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-lg text-label-lg">
                    {a.cat}
                  </span>
                </div>
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${a.img}')` }}
                />
              </div>
              <div className="p-gutter-md">
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2 group-hover:text-primary transition-colors">
                  {a.title}
                </h3>
                <p className="text-on-surface-variant font-body-md text-body-md mb-4 line-clamp-2">{a.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold" style={{ fontSize: 12 }}>
                      {a.initials}
                    </div>
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{a.name}</p>
                      <p className="text-on-surface-muted uppercase tracking-wider" style={{ fontSize: 10 }}>{a.date}</p>
                    </div>
                  </div>
                  <button className="bg-primary text-white px-6 py-2 rounded-full font-label-lg text-label-lg hover:bg-primary-container transition-colors shadow-md">
                    LIRE PLUS
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}
