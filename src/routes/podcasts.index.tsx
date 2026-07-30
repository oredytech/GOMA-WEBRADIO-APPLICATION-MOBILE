import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Screen } from "@/components/Screen";
import { podcastQuery } from "@/lib/queries";
import { usePlayer } from "@/context/player";
import { prettyDuration, relativeDate } from "@/lib/format";
import { podcastCategories } from "@/lib/programs";

export const Route = createFileRoute("/podcasts/")({
  component: Podcasts,
  loader: ({ context }) => context.queryClient.ensureQueryData(podcastQuery()),
  head: () => ({
    meta: [
      { title: "Podcasts — GOMA WEBRADIO" },
      { name: "description", content: "Reportages, magazines et émissions à la demande de Goma Webradio." },
      { property: "og:title", content: "Podcasts — GOMA WEBRADIO" },
      { property: "og:description", content: "Écoutez et téléchargez les podcasts de Goma Webradio." },
    ],
    links: [{ rel: "canonical", href: "/podcasts" }],
  }),
});

function Podcasts() {
  const { data: show } = useSuspenseQuery(podcastQuery());
  const { track, playing, toggle } = usePlayer();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tous");

  const episodes = useMemo(() => {
    const needle = q.toLowerCase();
    return show.episodes.filter((e) => {
      const matchQ = !needle || e.title.toLowerCase().includes(needle) || e.description.toLowerCase().includes(needle);
      const matchC = cat === "Tous" || `${e.title} ${e.description}`.toLowerCase().includes(cat.toLowerCase());
      return matchQ && matchC;
    });
  }, [show.episodes, q, cat]);

  return (
    <Screen title="Podcasts">
      <div className="pt-4">
        <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-3 shadow-soft">
          <span className="material-symbols-outlined text-inkmute">search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un épisode…"
            className="w-full border-0 bg-transparent p-0 text-sm text-ink placeholder:text-inkmute focus:outline-none focus:ring-0"
          />
          {q && (
            <button aria-label="Effacer" onClick={() => setQ("")} className="text-inkmute">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          )}
        </div>

        <div className="gw-scroll-x -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {podcastCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                "shrink-0 rounded-full px-4 py-2 text-xs font-bold active:scale-95 " +
                (cat === c ? "bg-brand text-white" : "border border-line bg-panel text-ink")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-panel p-4 shadow-soft">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-panel2">
          {show.image && <img src={show.image} alt={show.title} className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-extrabold text-ink">{show.title}</h2>
          <p className="line-clamp-2 text-xs text-inkmute">{show.description || show.author}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-brand">
            {show.episodes.length} épisodes
          </p>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        {episodes.map((ep) => {
          const isCurrent = track?.id === ep.id && playing;
          return (
            <article key={ep.id} className="rounded-2xl border border-line bg-panel p-3 shadow-soft">
              <div className="flex gap-3">
                <Link to="/podcasts/$id" params={{ id: ep.id }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-panel2">
                  {ep.image && <img src={ep.image} alt={ep.title} className="h-full w-full object-cover" loading="lazy" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to="/podcasts/$id" params={{ id: ep.id }}>
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">{ep.title}</h3>
                  </Link>
                  <p className="mt-1 text-xs text-inkmute">
                    {relativeDate(ep.date)} · {prettyDuration(ep.duration)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() =>
                        toggle({
                          id: ep.id,
                          kind: "podcast",
                          title: ep.title,
                          subtitle: ep.author,
                          artwork: ep.image,
                          src: ep.audio,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-blood px-3 py-1.5 text-xs font-bold text-white active:scale-95"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                        {isCurrent ? "pause" : "play_arrow"}
                      </span>
                      {isCurrent ? "Pause" : "Lecture"}
                    </button>
                    <a
                      href={ep.audio}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink active:scale-95"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                      Télécharger
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {episodes.length === 0 && <p className="text-sm text-inkmute">Aucun épisode trouvé.</p>}
      </section>
    </Screen>
  );
}
