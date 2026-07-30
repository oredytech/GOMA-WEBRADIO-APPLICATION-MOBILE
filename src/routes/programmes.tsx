import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen } from "@/components/Screen";
import { days, scheduleFor, currentShow } from "@/lib/programs";

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
  const [day, setDay] = useState(days[(new Date().getDay() + 6) % 7]);
  const live = currentShow();
  return (
    <Screen title="Programmes" back>
      <div className="gw-scroll-x -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={"shrink-0 rounded-full px-4 py-2 text-xs font-bold active:scale-95 " + (day === d ? "bg-brand text-white" : "border border-line bg-panel text-ink")}
          >
            {d}
          </button>
        ))}
      </div>

      <ol className="mt-5 space-y-0">
        {scheduleFor(day).map((s) => {
          const isLive = s.name === live.name;
          return (
            <li key={s.name} className="relative flex gap-4 pb-6 pl-1">
              <div className="w-14 shrink-0 pt-0.5 text-right">
                <p className="font-display text-sm font-extrabold text-ink">{s.time}</p>
                <p className="text-[11px] text-inkmute">{s.end}</p>
              </div>
              <div className="relative flex flex-col items-center">
                <span className={"mt-1 h-3 w-3 rounded-full " + (isLive ? "bg-blood" : "bg-brand/60")} />
                <span className="w-px flex-1 bg-line" />
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-line bg-panel p-3 shadow-soft">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-ink">{s.name}</h3>
                  {isLive && <span className="shrink-0 rounded-full bg-blood px-2 py-0.5 text-[10px] font-bold text-white">LIVE</span>}
                </div>
                <p className="truncate text-xs text-inkmute">{s.host} · {s.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Screen>
  );
}
