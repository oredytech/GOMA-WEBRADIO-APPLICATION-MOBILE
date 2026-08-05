import { Link, useLocation } from "@tanstack/react-router";

type Item = { to: string; icon: string; label: string };

const items: Item[] = [
  { to: "/", icon: "home", label: "Accueil" },
  { to: "/radio", icon: "radio", label: "Radio" },
  { to: "/podcasts", icon: "podcasts", label: "Podcasts" },
  { to: "/articles", icon: "feed", label: "Articles" },
  { to: "/videos", icon: "smart_display", label: "Vidéos" },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-panel/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[64px] max-w-2xl items-stretch justify-between gap-1 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">

        {items.map((it) => {
          const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              aria-label={it.label}
              className="group flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 transition-transform active:scale-95"
            >
              <span
                className={
                  "flex h-8 w-full max-w-[64px] items-center justify-center rounded-full transition-colors " +
                  (active ? "bg-brand/15 text-brand" : "text-inkmute group-hover:text-ink")
                }
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22, fontVariationSettings: active ? "'FILL' 1" : undefined }}
                >
                  {it.icon}
                </span>
              </span>
              <span
                className={
                  "truncate text-[11px] font-semibold " + (active ? "text-brand" : "text-inkmute")
                }
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
