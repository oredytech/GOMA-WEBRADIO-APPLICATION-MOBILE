import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import { useFavorites } from "@/hooks/useFavorites";

export const Route = createFileRoute("/favoris")({
  component: Favoris,
  head: () => ({
    meta: [
      { title: "Favoris — GOMA WEBRADIO" },
      { name: "description", content: "Vos podcasts et articles enregistrés sur Goma Webradio." },
      { property: "og:title", content: "Favoris — GOMA WEBRADIO" },
      { property: "og:description", content: "Retrouvez vos contenus enregistrés." },
    ],
    links: [{ rel: "canonical", href: "/favoris" }],
  }),
});

function Favoris() {
  const { items, toggle } = useFavorites();
  const podcasts = items.filter((i) => i.kind === "podcast");
  const articles = items.filter((i) => i.kind === "article");

  return (
    <Screen title="Favoris" back>
      {items.length === 0 && (
        <p className="pt-10 text-center text-sm text-inkmute">Aucun favori pour le moment.</p>
      )}
      {[{ t: "Podcasts enregistrés", list: podcasts }, { t: "Articles favoris", list: articles }].map(
        (group) =>
          group.list.length > 0 && (
            <section key={group.t} className="mt-6">
              <h2 className="mb-3 font-display text-lg font-extrabold text-ink">{group.t}</h2>
              <div className="space-y-3">
                {group.list.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 shadow-soft">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-panel2">
                      {f.image && <img src={f.image} alt={f.title} className="h-full w-full object-cover" />}
                    </div>
                    <Link to={f.href} className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold text-ink">{f.title}</p>
                      <p className="truncate text-xs text-inkmute">{f.subtitle}</p>
                    </Link>
                    <button aria-label="Retirer" onClick={() => toggle(f)} className="shrink-0 text-blood active:scale-95">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ),
      )}
    </Screen>
  );
}
