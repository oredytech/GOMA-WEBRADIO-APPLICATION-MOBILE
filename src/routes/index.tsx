import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Screen, SectionHeader } from "@/components/Screen";
import { SmartImage } from "@/components/SmartImage";
import { TimeAgo } from "@/components/TimeAgo";
import { AsyncSection, CardListSkeleton, TilesSkeleton } from "@/components/Async";
import { LIVE_TRACK, usePlayer } from "@/context/player";
import { articlesQuery, podcastQuery } from "@/lib/queries";
import { prettyDuration, shareContent } from "@/lib/format";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { PLAY_BG_URL, RADIO_NAME, RADIO_SLOGAN, SOCIALS, YOUTUBE_URL } from "@/lib/media";

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
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Home() {
  const { track, playing, loading, toggle } = usePlayer();
  const articlesQ = useQuery(articlesQuery({ perPage: 6 }));
  const podcastQ = useQuery(podcastQuery());
  const nowPlaying = useNowPlaying();
  const isLive = track?.kind === "radio" && playing;
  const isLoadingLive = track?.kind === "radio" && loading;

  const episodes = podcastQ.data?.episodes ?? [];
  const [latest, ...rest] = episodes;

  return (
    <Screen>
      {/* Live player */}
      <section className="pt-4">
        <div className="relative overflow-hidden rounded-2xl shadow-lift">
          <img src={PLAY_BG_URL} alt="Écoute en direct" className="h-72 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#011b40] via-[#011b40]/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 space-y-3 p-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-blood px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> En direct
            </span>
            <div>
              <h2 className="line-clamp-2 font-display text-2xl font-extrabold leading-tight text-white">
                {nowPlaying ?? RADIO_NAME}
              </h2>
              <p className="text-sm text-white/80">{nowPlaying ? RADIO_NAME : RADIO_SLOGAN}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggle(LIVE_TRACK)}
                aria-label={isLive ? "Pause" : "Écouter en direct"}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-blood text-white shadow-lift transition-transform active:scale-95"
              >
                <span
                  className={"material-symbols-outlined " + (isLoadingLive ? "animate-spin" : "")}
                  style={{ fontSize: 34, fontVariationSettings: "'FILL' 1" }}
                >
                  {isLoadingLive ? "progress_activity" : isLive ? "pause" : "play_arrow"}
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

      {/* Recent podcasts — effet album */}
      <section className="mt-7">
        <SectionHeader title="Podcasts récents" />
        <AsyncSection
          isPending={podcastQ.isPending}
          isError={podcastQ.isError}
          isFetching={podcastQ.isFetching}
          onRetry={() => void podcastQ.refetch()}
          errorMessage="Impossible de charger les podcasts."
          skeleton={<TilesSkeleton />}
        >
          {latest ? (
            <div className="flex items-end gap-3">
              {/* Dernier épisode : pochette principale */}
              <article className="w-1/2 shrink-0">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-panel2 shadow-lift ring-1 ring-line">
                  <Link to="/podcasts/$id" params={{ id: latest.id }} className="block h-full w-full">
                    <SmartImage src={latest.image} alt={latest.title} className="h-full w-full object-cover" loading="eager" />
                  </Link>
                  <span className="absolute left-2 top-2 rounded-full bg-blood px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                    Nouveau
                  </span>
                  <EpisodeButton ep={latest} big />
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-ink">{latest.title}</h3>
                <p className="mt-0.5 text-xs text-inkmute">{prettyDuration(latest.duration)}</p>
              </article>

              {/* Épisodes précédents : pile d'albums */}
              <div className="gw-scroll-x -mr-4 flex flex-1 gap-2 overflow-x-auto pb-2 pr-4">
                {rest.slice(0, 7).map((ep, i) => (
                  <article
                    key={ep.id}
                    className="w-28 shrink-0"
                    style={{ transform: `translateY(${Math.min(i, 3) * 3}px) scale(${1 - Math.min(i, 3) * 0.02})` }}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-panel2 shadow-soft ring-1 ring-line">
                      <Link to="/podcasts/$id" params={{ id: ep.id }} className="block h-full w-full">
                        <SmartImage src={ep.image} alt={ep.title} className="h-full w-full object-cover" />
                      </Link>
                      <EpisodeButton ep={ep} />
                    </div>
                    <h3 className="mt-1.5 line-clamp-2 text-xs font-bold leading-snug text-ink">{ep.title}</h3>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-inkmute">Aucun épisode disponible pour le moment.</p>
          )}
        </AsyncSection>
      </section>

      {/* Vidéos */}
      <section className="mt-7">
        <SectionHeader title="Vidéos" />
        <a
          href={YOUTUBE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4 shadow-soft active:scale-[0.99]"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blood/15 text-blood">
            <span className="material-symbols-outlined" style={{ fontSize: 30, fontVariationSettings: "'FILL' 1" }}>
              smart_display
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-extrabold text-ink">Chaîne YouTube</span>
            <span className="block truncate text-xs text-inkmute">
              Reportages, émissions filmées et directs vidéo
            </span>
          </span>
          <span className="material-symbols-outlined shrink-0 text-inkmute">open_in_new</span>
        </a>
      </section>

      {/* News */}
      <section className="mt-7">
        <SectionHeader title="Dernières actualités" />
        <AsyncSection
          isPending={articlesQ.isPending}
          isError={articlesQ.isError}
          isFetching={articlesQ.isFetching}
          onRetry={() => void articlesQ.refetch()}
          errorMessage="Impossible de charger les actualités."
          skeleton={<CardListSkeleton rows={3} />}
        >
          <div className="space-y-3">
            {(articlesQ.data ?? []).slice(0, 5).map((a) => (
              <Link
                key={a.id}
                to="/articles/$slug"
                params={{ slug: a.slug }}
                className="flex gap-3 rounded-2xl border border-line bg-panel p-3 shadow-soft active:scale-[0.99]"
              >
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-panel2">
                  <SmartImage src={a.image} alt={a.title} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand">{a.category}</p>
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">{a.title}</h3>
                  <p className="mt-1 truncate text-xs text-inkmute">
                    <TimeAgo date={a.date} /> · {a.readingTime} min
                  </p>
                </div>
              </Link>
            ))}
            {(articlesQ.data ?? []).length === 0 && (
              <p className="text-sm text-inkmute">Aucune actualité pour le moment.</p>
            )}
          </div>
        </AsyncSection>
        <Link
          to="/articles"
          className="mt-4 flex items-center justify-center rounded-full border border-line bg-panel py-3 text-sm font-bold text-ink active:scale-95"
        >
          Voir toutes les actualités
        </Link>
      </section>

      {/* Réseaux sociaux */}
      <section className="mt-7">
        <SectionHeader title="Suivez-nous" />
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
      </section>
    </Screen>
  );
}

function EpisodeButton({
  ep,
  big,
}: {
  ep: { id: string; title: string; author: string; image: string | null; audio: string };
  big?: boolean;
}) {
  const { track, playing, loading, toggle } = usePlayer();
  const isCurrent = track?.id === ep.id;
  const epPlaying = isCurrent && playing;
  const epLoading = isCurrent && loading;
  return (
    <button
      aria-label={epPlaying ? `Pause ${ep.title}` : `Écouter ${ep.title}`}
      onClick={() =>
        toggle({ id: ep.id, kind: "podcast", title: ep.title, subtitle: ep.author, artwork: ep.image, src: ep.audio })
      }
      className={
        "absolute bottom-2 right-2 flex items-center justify-center rounded-full bg-blood text-white shadow-lift active:scale-95 " +
        (big ? "h-12 w-12" : "h-9 w-9")
      }
    >
      <span
        className={"material-symbols-outlined " + (epLoading ? "animate-spin" : "")}
        style={{ fontSize: big ? 26 : 20, fontVariationSettings: "'FILL' 1" }}
      >
        {epLoading ? "progress_activity" : epPlaying ? "pause" : "play_arrow"}
      </span>
    </button>
  );
}
