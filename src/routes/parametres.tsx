import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Screen } from "@/components/Screen";
import { EQ_PRESETS, usePlayer, type EqBands, type EqKind } from "@/context/player";


export const Route = createFileRoute("/parametres")({
  component: Parametres,
  head: () => ({
    meta: [
      { title: "Paramètres — GOMA WEBRADIO" },
      { name: "description", content: "Mode sombre, notifications, qualité de streaming et téléchargements." },
      { property: "og:title", content: "Paramètres — GOMA WEBRADIO" },
      { property: "og:description", content: "Personnalisez votre expérience d'écoute." },
    ],
    links: [{ rel: "canonical", href: "/parametres" }],
  }),
});

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-panel p-4 text-left shadow-soft active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{label}</p>
        <p className="truncate text-xs text-inkmute">{desc}</p>
      </div>
      <span className={"relative h-7 w-12 shrink-0 rounded-full transition-colors " + (on ? "bg-brand" : "bg-line")}>
        <span className={"absolute top-1 h-5 w-5 rounded-full bg-white transition-all " + (on ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

function Parametres() {
  const [dark, setDark] = useState(false);
  const [notif, setNotif] = useState(true);
  const [wifi, setWifi] = useState(true);
  const [quality, setQuality] = useState("Auto");

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const setTheme = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("gw-theme", v ? "dark" : "light");
  };

  return (
    <Screen title="Paramètres" back>
      <div className="mt-4 space-y-3">
        <Toggle on={dark} onChange={setTheme} label="Mode sombre" desc="Thème bleu nuit #011b40" />
        <Toggle on={notif} onChange={setNotif} label="Notifications" desc="Alertes info et nouveaux épisodes" />
        <Toggle on={wifi} onChange={setWifi} label="Téléchargement en Wi-Fi uniquement" desc="Économisez vos données mobiles" />

        <div className="rounded-2xl border border-line bg-panel p-4 shadow-soft">
          <p className="text-sm font-bold text-ink">Qualité du streaming</p>
          <div className="mt-3 flex gap-2">
            {["Auto", "Normale", "Haute"].map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={"flex-1 rounded-full px-3 py-2 text-xs font-bold active:scale-95 " + (quality === q ? "bg-brand text-white" : "border border-line bg-panel2 text-ink")}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
