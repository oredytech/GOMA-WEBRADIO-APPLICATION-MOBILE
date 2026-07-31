import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Screen, SectionHeader } from "@/components/Screen";
import { SmartImage } from "@/components/SmartImage";
import { LIVE_TRACK, usePlayer } from "@/context/player";
import { articlesQuery, podcastQuery } from "@/lib/queries";
import { prettyDuration, relativeDate, shareContent } from "@/lib/format";
import { useSchedule } from "@/hooks/useSchedule";
import playBg from "@/assets/play-bg.webp.asset.json";


export const Route = createFileRoute("/")({
  component: Home,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(articlesQuery({ perPage: 6 }));
    void context.queryClient.prefetchQuery(podcastQuery());
  },
  head: () => ({
    meta: [
      { title: "Accueil — GOMA WEBRADIO" },
      {
        name: "description",
        content: "Radio en direct, podcasts récents et dernières actualités depuis Goma, RDC.",
      },
      { property: "og:title", content: "Accueil — GOMA WEBRADIO" },
      { property: "og:description", content: "Écoute en direct, podcasts et actualités du Nord-Kivu." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Home() {
  const { track, playing, loading, toggle } = usePlayer();
  const { data: articles } = useSuspenseQuery(articlesQuery({ perPage: 6 }));
  const { data: show } = useSuspenseQuery(podcastQuery());
  const { show: live } = useSchedule();
  const isLive = track?.kind === "radio" && playing;
  const isLoadingLive = track?.kind === "radio" && loading;


  return (
    <Screen>
      {/* Live player */}
      <section className="pt-4">
        <div className="relative overflow-hidden rounded-2xl shadow-lift">
          <img src={playBg.url} alt="Écoute en direct" className="h-72 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#011b40] via-[#011b40]/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 space-y-3 p-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-blood px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> En direct
            </span>
            <div>
              <h2 className="font-display text-2xl font-extrabold leading-tight text-white">
                {live.name}
              </h2>
              <p className="text-sm text-white/80">Avec {live.host}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggle(LIVE_TRACK)}
                aria-label={isLive ? "Pause" : "Écouter en direct"}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-blood text-white shadow-lift transition-transform active:scale-95"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 34, fontVariationSettings: "'FILL' 1" }}
                >
                  {loading && track?.kind === "radio" ? "hourglass_empty" : isLive ? "pause" : "play_arrow"}
                </span>
              </button>
              <div className="flex h-10 items-end gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={"w-1.5 rounded-full bg-brand " + (isLive ? "animate-eq" : "")}
                    style={{ height: 8 + i * 6, animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  aria-label="Partager"
                  onClick={() => shareContent({ title: "GOMA WEBRADIO en direct" })}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur active:scale-95"
                >
                  <span className="material-symbols-outlined">share</span>
                </button>
                <Link
                  to="/radio"
                  aria-label="Ouvrir la radio"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur active:scale-95"
                >
                  <span className="material-symbols-outlined">open_in_full</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick access */}
      <section className="mt-5 grid grid-cols-2 gap-3">
        {[
          { to: "/programmes", icon: "calendar_month", label: "Programmes" },
          { to: "/favoris", icon: "favorite", label: "Favoris" },
        ].map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 shadow-soft active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <span className="material-symbols-outlined">{q.icon}</span>
            </span>
            <span className="truncate text-sm font-bold text-ink">{q.label}</span>
          </Link>
        ))}
      </section>

      {/* Recent podcasts */}
      <section className="mt-7">
        <SectionHeader title="Podcasts récents" />
        <div className="gw-scroll-x -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {show.episodes.slice(0, 8).map((ep) => (
            <article key={ep.id} className="w-40 shrink-0 snap-start">
              <Link to="/podcasts/$id" params={{ id: ep.id }} className="block">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-panel2 shadow-soft">
                  {ep.image && <img src={ep.image} alt={ep.title} className="h-full w-full object-cover" loading="lazy" />}
                </div>
              </Link>
              <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-ink">{ep.title}</h3>
              <p className="mt-0.5 text-xs text-inkmute">{prettyDuration(ep.duration)}</p>
            </article>
          ))}
          {show.episodes.length === 0 && (
            <p className="text-sm text-inkmute">Podcasts indisponibles pour le moment.</p>
          )}
        </div>
      </section>

      {/* Popular banner */}
      <section className="mt-7">
        <div className="rounded-2xl bg-gradient-to-r from-brand to-[#0b6ea8] p-5 text-white shadow-lift">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/80">À la une</p>
          <h3 className="mt-1 font-display text-xl font-extrabold">Sauti ya Amani</h3>
          <p className="mt-1 text-sm text-white/85">
            Le magazine qui donne la parole à la paix et à la cohésion sociale au Nord-Kivu.
          </p>
          <Link
            to="/podcasts"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#011b40] active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>headphones</span>
            Écouter
          </Link>
        </div>
      </section>

      {/* News */}
      <section className="mt-7">
        <SectionHeader title="Dernières actualités" />
        <div className="space-y-3">
          {articles.slice(0, 5).map((a) => (
            <Link
              key={a.id}
              to="/articles/$slug"
              params={{ slug: a.slug }}
              className="flex gap-3 rounded-2xl border border-line bg-panel p-3 shadow-soft active:scale-[0.99]"
            >
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-panel2">
                {a.image && <img src={a.image} alt={a.title} className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand">{a.category}</p>
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">{a.title}</h3>
                <p className="mt-1 truncate text-xs text-inkmute">
                  {relativeDate(a.date)} · {a.readingTime} min
                </p>
              </div>
            </Link>
          ))}
          {articles.length === 0 && (
            <p className="text-sm text-inkmute">Actualités indisponibles pour le moment.</p>
          )}
        </div>
        <Link
          to="/articles"
          className="mt-4 flex items-center justify-center rounded-full border border-line bg-panel py-3 text-sm font-bold text-ink active:scale-95"
        >
          Voir toutes les actualités
        </Link>
      </section>
    </Screen>
  );
}
