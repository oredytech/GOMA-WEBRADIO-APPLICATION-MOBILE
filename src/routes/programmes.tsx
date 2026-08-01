import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/Screen";
import { days, scheduleFor } from "@/lib/programs";

export const Route = createFileRoute("/programmes")({
  component: Programmes,
  head: () => ({
    meta: [
      { title: "Programmes — GOMA WEBRADIO" },
      { name: "description", content: "La grille des émissions de Goma Webradio, heure par heure." },
      { property: "og:title", content: "Programmes — GOMA WEBRADIO" },
      { property: "og:description", content: "Planning journalier des émissions." },
    ],
    links: [{ rel: "canonical", href: "/programmes" }],
  }),
});

function Programmes() {
  const [day, setDay] = useState(days[0]);
  return (
    <Screen title="Programmes" back>
      <div className="relative">
        <div aria-hidden className="pointer-events-none select-none blur-[6px] opacity-60">
          <div className="gw-scroll-x -mx-4 mt-4 flex gap-2 overflow-hidden px-4">
            {days.map((d) => (
              <span
                key={d}
                className={"shrink-0 rounded-full px-4 py-2 text-xs font-bold " + (day === d ? "bg-brand text-white" : "border border-line bg-panel text-ink")}
              >
                {d}
              </span>
            ))}
          </div>

          <ol className="mt-5 space-y-0">
            {scheduleFor(day).map((s) => (
              <li key={s.name} className="relative flex gap-4 pb-6 pl-1">
                <div className="w-14 shrink-0 pt-0.5 text-right">
                  <p className="font-display text-sm font-extrabold text-ink">{s.time}</p>
                  <p className="text-[11px] text-inkmute">{s.end}</p>
                </div>
                <div className="relative flex flex-col items-center">
                  <span className="mt-1 h-3 w-3 rounded-full bg-brand/60" />
                  <span className="w-px flex-1 bg-line" />
                </div>
                <div className="min-w-0 flex-1 rounded-2xl border border-line bg-panel p-3 shadow-soft">
                  <h3 className="truncate text-sm font-bold text-ink">{s.name}</h3>
                  <p className="truncate text-xs text-inkmute">{s.host} · {s.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Mention de réaménagement */}
        <div className="absolute inset-0 flex items-start justify-center pt-24">
          <div className="mx-4 flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-line bg-panel/95 p-6 text-center shadow-lift backdrop-blur-xl">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blood/15 text-blood">
              <span className="material-symbols-outlined" style={{ fontSize: 30 }}>construction</span>
            </span>
            <h2 className="font-display text-xl font-extrabold text-ink">Programme en réaménagement</h2>
            <p className="text-sm text-inkmute">
              La nouvelle grille des émissions arrive bientôt. En attendant, écoutez le direct
              et nos podcasts.
            </p>
          </div>
        </div>
      </div>

      {/* Contrôle de jour désactivé (conservé pour la future grille) */}
      <span className="sr-only">
        <button onClick={() => setDay(days[0])}>Jour</button>
      </span>
    </Screen>
  );
}
