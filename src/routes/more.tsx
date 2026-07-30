import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import logo from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/more")({
  component: More,
  head: () => ({
    meta: [
      { title: "Plus — GOMA WEBRADIO" },
      { name: "description", content: "Programmes, favoris, notifications, paramètres et à propos de Goma Webradio." },
      { property: "og:title", content: "Plus — GOMA WEBRADIO" },
      { property: "og:description", content: "Tous les réglages et contenus de Goma Webradio." },
    ],
    links: [{ rel: "canonical", href: "/more" }],
  }),
});

const links = [
  { to: "/programmes", icon: "calendar_month", label: "Programmes", desc: "Grille des émissions" },
  { to: "/favoris", icon: "favorite", label: "Favoris", desc: "Podcasts et articles enregistrés" },
  { to: "/notifications", icon: "notifications", label: "Notifications", desc: "Alertes et rappels" },
  { to: "/parametres", icon: "settings", label: "Paramètres", desc: "Thème, streaming, téléchargements" },
  { to: "/apropos", icon: "info", label: "À propos", desc: "La station et l'équipe" },
];

function More() {
  return (
    <Screen title="Plus">
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 shadow-soft">
        <img src={logo.url} alt="GOMA WEBRADIO" className="h-14 w-14 shrink-0 rounded-2xl bg-[#011b40] object-contain p-2" />
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-extrabold text-ink">GOMA WEBRADIO</h2>
          <p className="truncate text-xs text-inkmute">La voix de Goma · Nord-Kivu, RDC</p>
        </div>
      </div>

      <nav className="mt-4 space-y-2">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 shadow-soft active:scale-[0.99]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <span className="material-symbols-outlined">{l.icon}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{l.label}</p>
              <p className="truncate text-xs text-inkmute">{l.desc}</p>
            </div>
            <span className="material-symbols-outlined shrink-0 text-inkmute">chevron_right</span>
          </Link>
        ))}
      </nav>
    </Screen>
  );
}
