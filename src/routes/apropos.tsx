import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/Screen";
import { SmartImage } from "@/components/SmartImage";
import { ErrorRetry, Skeleton } from "@/components/Async";
import { teamQuery } from "@/lib/queries";
import { CONTACT_EMAIL, LOGO_URL, RADIO_SLOGAN, SOCIALS } from "@/lib/media";


export const Route = createFileRoute("/apropos")({
  component: APropos,
  head: () => ({
    meta: [
      { title: "À propos — GOMA WEBRADIO" },
      { name: "description", content: "GOMA WEBRADIO, média digital de Goma : radio, podcasts et actualités du Nord-Kivu." },
      { property: "og:title", content: "À propos — GOMA WEBRADIO" },
      { property: "og:description", content: "La voix de Goma, au service de l'information." },
    ],
    links: [{ rel: "canonical", href: "/apropos" }],
  }),
});

function APropos() {
  return (
    <Screen title="À propos" back>
      <div className="mt-6 flex flex-col items-center text-center">
        <img src={LOGO_URL} alt="GOMA WEBRADIO" className="h-24 w-24 rounded-3xl bg-[#011b40] object-contain p-4" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">GOMA WEBRADIO</h1>
        <p className="mt-2 text-sm leading-relaxed text-inkmute">
          Média digital basé à Goma, au Nord-Kivu (RDC). Nous diffusons une radio en direct 24h/24, des
          podcasts de reportages et l'actualité de la région et du pays.
        </p>
        <p className="mt-2 text-sm font-bold text-brand">{RADIO_SLOGAN}</p>
      </div>

      <div className="mt-6 space-y-3">
        {[
          { icon: "language", label: "Site web", value: "gomawebradio.com" },
          { icon: "mail", label: "Contact", value: CONTACT_EMAIL },
          { icon: "location_on", label: "Studio", value: "Goma, Nord-Kivu, RDC" },
          { icon: "verified", label: "Version", value: "1.0.0" },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 shadow-soft">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <span className="material-symbols-outlined">{r.icon}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-inkmute">{r.label}</p>
              <p className="truncate text-sm font-bold text-ink">{r.value}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-7 mb-3 font-display text-lg font-extrabold text-ink">Suivez-nous</h2>
      <div className="grid grid-cols-2 gap-3">
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 shadow-soft active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <span className="material-symbols-outlined">{s.icon}</span>
            </span>
            <span className="truncate text-sm font-bold text-ink">{s.label}</span>
          </a>
        ))}
      </div>
    </Screen>
  );
}
