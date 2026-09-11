import { Link } from "@tanstack/react-router";
import { SmartImage } from "@/components/SmartImage";
import { TimeAgo } from "@/components/TimeAgo";
import { prettyDuration } from "@/lib/format";
import { usePlayer } from "@/context/player";
import { cleanEpisodeTitle, seriesOf } from "@/lib/series";
import type { Episode } from "@/lib/feeds.types";

export function EpisodeRow({ ep, showSeries = false }: { ep: Episode; showSeries?: boolean }) {
  const { track, playing, toggle } = usePlayer();
  const isCurrent = track?.id === ep.id && playing;
  const title = cleanEpisodeTitle(ep);
  const serie = seriesOf(ep);

  return (
    <article className="rounded-2xl border border-line bg-panel p-3 shadow-soft">
      <div className="flex gap-3">
        <Link
          to="/podcasts/$id"
          params={{ id: ep.id }}
          className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-panel2"
        >
          <SmartImage src={ep.image} alt={title} className="h-full w-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          {showSeries && (
            <Link
              to="/podcasts/serie/$slug"
              params={{ slug: serie.slug }}
              className="text-[11px] font-bold uppercase tracking-wide text-brand"
            >
              {serie.name}
            </Link>
          )}
          <Link to="/podcasts/$id" params={{ id: ep.id }}>
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">{title}</h3>
          </Link>
          <p className="mt-1 text-xs text-inkmute">
            <TimeAgo date={ep.date} /> · {prettyDuration(ep.duration)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() =>
                toggle({
                  id: ep.id,
                  kind: "podcast",
                  title,
                  subtitle: serie.name,
                  artwork: ep.image,
                  src: ep.audio,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-blood px-3 py-1.5 text-xs font-bold text-white active:scale-95"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
              >
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
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                download
              </span>
              Télécharger
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
