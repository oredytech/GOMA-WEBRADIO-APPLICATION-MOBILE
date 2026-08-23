import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Screen, SectionHeader } from "@/components/Screen";
import { SmartImage } from "@/components/SmartImage";
import { TimeAgo } from "@/components/TimeAgo";
import { AsyncSection, CardListSkeleton, TilesSkeleton } from "@/components/Async";
import { LIVE_TRACK, usePlayer } from "@/context/player";
import { articlesQuery, podcastQuery, videosQuery } from "@/lib/queries";
import { prettyDuration, shareContent } from "@/lib/format";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { Marquee } from "@/components/Marquee";
import { PLAY_BG_URL, RADIO_NAME, RADIO_SLOGAN, SOCIALS } from "@/lib/media";

export const Route = createFileRoute("/")({
  component: Home,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(articlesQuery({ perPage: 6 }));
    void context.queryClient.prefetchQuery(podcastQuery());
    void context.queryClient.prefetchQuery(videosQuery());
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
  const videosQ = useQuery(videosQuery());
  const { title: nowTitle, next: nextTitle } = useNowPlaying();
  const isLive = track?.kind === "radio" && playing;
  const isLoadingLive = track?.kind === "radio" && loading;

  const episodes = podcastQ.data?.episodes ?? [];
  const videos = videosQ.data ?? [];

  return (
    <Screen transparentBar>
      {/* Live player — l'image déborde derrière l'en-tête */}
      <section className="-mx-4 -mt-14">
        <div className="relative overflow-hidden rounded-b-3xl shadow-lift">
          <img src={PLAY_BG_URL} alt="Écoute en direct" className="h-[26rem] w-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#011b40] via-[#011b40]/55 to-[#011b40]/25" />
          <div className="absolute inset-x-0 bottom-0 space-y-3 px-4 pb-5 pt-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-blood px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> En direct
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60">
                {nowTitle ? "En cours" : RADIO_NAME}
              </p>
              <Marquee
                text={nowTitle ?? RADIO_NAME}
                className="font-display text-base font-extrabold leading-tight text-white"
              />
              {nextTitle ? (
                <Marquee text={`Suivant · ${nextTitle}`} className="mt-0.5 text-xs text-white/70" />
              ) : (
                <p className="mt-0.5 truncate text-xs text-white/70">{RADIO_SLOGAN}</p>
              )}
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

      {/* Podcasts récents */}
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
          {episodes.length > 0 ? (
            <div className="gw-scroll-x -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
              {episodes.slice(0, 8).map((ep, i) => (
                <article key={ep.id} className="w-44 shrink-0">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-panel2 shadow-lift ring-1 ring-line">
                    <Link to="/podcasts/$id" params={{ id: ep.id }} className="block h-full w-full">
                      <SmartImage
                        src={ep.image}
                        alt={ep.title}
                        className="h-full w-full object-cover"
                        loading={i === 0 ? "eager" : "lazy"}
                      />
                    </Link>
                    {i === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-blood px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                        Nouveau
                      </span>
                    )}
                    <EpisodeButton ep={ep} big />
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-ink">{ep.title}</h3>
                  <p className="mt-0.5 text-xs text-inkmute">{prettyDuration(ep.duration)}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-inkmute">Aucun épisode disponible pour le moment.</p>
          )}
        </AsyncSection>
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
          search={{ page: 1 }}
          className="mt-4 flex items-center justify-center rounded-full border border-line bg-panel py-3 text-sm font-bold text-ink active:scale-95"
        >
          Voir toutes les actualités
        </Link>
      </section>

      {/* Vidéos */}
      <section className="mt-7">
        <SectionHeader title="Vidéos" />
        <AsyncSection
          isPending={videosQ.isPending}
          isError={videosQ.isError}
          isFetching={videosQ.isFetching}
          onRetry={() => void videosQ.refetch()}
          errorMessage="Impossible de charger les vidéos."
          skeleton={<TilesSkeleton />}
        >
          <div className="gw-scroll-x -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {videos.slice(0, 6).map((v) => (
              <Link
                key={v.id}
                to="/videos"
                className="w-64 shrink-0"
              >
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-panel2 shadow-lift ring-1 ring-line">
                  <SmartImage src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blood text-white shadow-lift">
                      <span className="material-symbols-outlined" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                    </span>
                  </span>
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-ink">{v.title}</h3>
                <p className="mt-0.5 text-xs text-inkmute"><TimeAgo date={v.date} /></p>
              </Link>
            ))}
            {videos.length === 0 && <p className="text-sm text-inkmute">Aucune vidéo disponible.</p>}
          </div>
        </AsyncSection>
        <Link
          to="/videos"
          className="mt-4 flex items-center justify-center rounded-full border border-line bg-panel py-3 text-sm font-bold text-ink active:scale-95"
        >
          Voir toutes les vidéos
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
