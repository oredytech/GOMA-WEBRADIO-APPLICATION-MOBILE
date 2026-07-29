import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { useState } from "react";

export const Route = createFileRoute("/more")({
  component: More,
  head: () => ({
    meta: [
      { title: "Menu — GOMA WEBRADIO" },
      { name: "description", content: "Profil, favoris, notifications et paramètres de votre compte GOMA WEBRADIO." },
    ],
  }),
});

function More() {
  const [dark, setDark] = useState(false);
  const toggle = () => {
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  return (
    <div className="min-h-screen bg-surface pb-40 text-on-surface">
      <TopBar />
      <main className="pt-20 px-margin-mobile max-w-2xl mx-auto space-y-stack-xl">
        {/* Profile */}
        <section className="bg-white p-stack-lg rounded-lg shadow-sm border border-outline-variant/20 flex items-center gap-stack-lg">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-secondary-container">
              <img
                className="w-full h-full object-cover"
                alt="Profil"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdICNbBFXunaQ_v01-QBgStwa7bgnajtMjYbkrAkLfOTVV6p_xJixzuOHTWG9hVSMYAQ5KS4YN13yzxPd2B0CQxxBs4oViWqYV2KYqExd1cjVDe1Vcl0kkjZu7-WLnvtEIJObwcEf0pOdZ4vLof8WdUPVUHKy6bRIng0d7cGGNBo5VXZmG8GmLTZCk1FkJvyN27ut_4GfZACsFvyUp3ritRwyLSw9YBPeaPwysmYsd2WqaqpF6Pe_zOA"
              />
            </div>
            <div className="absolute bottom-0 right-0 bg-secondary-container text-on-secondary-container rounded-full p-1 border-2 border-white">
              <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-title-lg text-title-lg text-on-surface">Goma Listener</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Membre Premium • Goma, RDC</p>
          </div>
          <button className="text-outline hover:text-primary transition-colors">
            <span className="material-symbols-outlined">edit</span>
          </button>
        </section>

        {/* Main menu */}
        <section className="space-y-stack-sm">
          <h3 className="font-label-lg text-label-lg text-on-surface-variant uppercase px-stack-md mb-2">Menu Principal</h3>
          <div className="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/20">
            {[
              { icon: "calendar_month", label: "Programmes", tint: "bg-secondary/10 text-secondary" },
              { icon: "bookmark", label: "Favoris", tint: "bg-primary/10 text-primary" },
              { icon: "notifications", label: "Notifications", badge: 3, tint: "bg-tertiary/10 text-tertiary" },
            ].map((it, i) => (
              <a
                key={it.label}
                href="#"
                className={
                  "flex items-center gap-4 p-4 hover:bg-surface-variant transition-colors group " +
                  (i > 0 ? "border-t border-outline-variant/20" : "")
                }
              >
                <div className={"w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform " + it.tint}>
                  <span className="material-symbols-outlined">{it.icon}</span>
                </div>
                <span className="flex-1 font-body-lg text-body-lg">{it.label}</span>
                {it.badge && (
                  <span className="bg-primary text-white px-2 py-0.5 rounded-full font-bold" style={{ fontSize: 10 }}>
                    {it.badge}
                  </span>
                )}
                <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
              </a>
            ))}
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-stack-sm">
          <h3 className="font-label-lg text-label-lg text-on-surface-variant uppercase px-stack-md mb-2">Préférences</h3>
          <div className="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/20">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-on-surface/5 flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined">dark_mode</span>
              </div>
              <span className="flex-1 font-body-lg text-body-lg">Mode Sombre</span>
              <button
                onClick={toggle}
                className={
                  "relative w-11 h-6 rounded-full transition-colors " +
                  (dark ? "bg-primary" : "bg-outline-variant")
                }
              >
                <span
                  className={
                    "absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform " +
                    (dark ? "translate-x-5" : "")
                  }
                />
              </button>
            </div>
            {[
              { icon: "settings", label: "Paramètres", tint: "bg-outline/10 text-outline" },
              { icon: "info", label: "À propos", tint: "bg-on-surface-variant/10 text-on-surface-variant" },
            ].map((it) => (
              <a
                key={it.label}
                href="#"
                className="flex items-center gap-4 p-4 hover:bg-surface-variant transition-colors group border-t border-outline-variant/20"
              >
                <div className={"w-10 h-10 rounded-full flex items-center justify-center " + it.tint}>
                  <span className="material-symbols-outlined">{it.icon}</span>
                </div>
                <span className="flex-1 font-body-lg text-body-lg">{it.label}</span>
                <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
              </a>
            ))}
          </div>
        </section>

        <button className="w-full p-4 flex items-center justify-center gap-2 text-primary font-bold hover:bg-primary/5 rounded-lg transition-colors mt-8">
          <span className="material-symbols-outlined">logout</span>
          <span>Déconnexion</span>
        </button>

        <div className="text-center pb-8">
          <p className="font-label-lg text-on-surface-variant opacity-50">Version 2.4.0 (Goma Build)</p>
          <p className="font-label-lg text-on-surface-variant opacity-50">© 2024 GOMA WEBRADIO</p>
        </div>
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}
