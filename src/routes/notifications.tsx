import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
  head: () => ({
    meta: [
      { title: "Notifications — GOMA WEBRADIO" },
      { name: "description", content: "Alertes info, nouveaux podcasts et rappels d'émissions." },
      { property: "og:title", content: "Notifications — GOMA WEBRADIO" },
      { property: "og:description", content: "Vos dernières alertes Goma Webradio." },
    ],
    links: [{ rel: "canonical", href: "/notifications" }],
  }),
});

const items = [
  { icon: "podcasts", title: "Nouvel épisode disponible", desc: "Sauti ya Amani — magazine paix", time: "il y a 2 h" },
  { icon: "campaign", title: "Alerte info", desc: "Point de sécurité à Goma ce midi", time: "il y a 5 h" },
  { icon: "radio", title: "Rappel d'émission", desc: "Le Grand Réveil commence à 05:00", time: "hier" },
];

function Notifications() {
  return (
    <Screen title="Notifications" back>
      <div className="mt-4 space-y-3">
        {items.map((n) => (
          <div key={n.title} className="flex gap-3 rounded-2xl border border-line bg-panel p-4 shadow-soft">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <span className="material-symbols-outlined">{n.icon}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{n.title}</p>
              <p className="truncate text-xs text-inkmute">{n.desc}</p>
              <p className="mt-1 text-[11px] text-inkmute">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
