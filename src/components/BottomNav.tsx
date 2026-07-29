import { Link, useLocation } from "@tanstack/react-router";

type Item = { to: string; icon: string; label: string };
const items: Item[] = [
  { to: "/", icon: "home", label: "Home" },
  { to: "/radio", icon: "radio", label: "Radio" },
  { to: "/podcasts", icon: "podcasts", label: "Podcasts" },
  { to: "/articles", icon: "article", label: "Articles" },
  { to: "/more", icon: "more_horiz", label: "More" },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/85 backdrop-blur-md border-t border-outline-variant/40 shadow-lg flex justify-around items-center pt-2 pb-4 px-2 rounded-t-lg">
      {items.map((it) => {
        const active = pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={
              active
                ? "flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-5 py-1 transition-transform active:scale-95"
                : "flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 rounded-full transition-transform active:scale-95"
            }
          >
            <span
              className="material-symbols-outlined"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {it.icon}
            </span>
            <span className="font-label-lg text-label-lg mt-1">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
