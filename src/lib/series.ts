import type { Episode } from "./feeds.types";

export type SeriesDef = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  test: RegExp;
};

export const seriesDefs: SeriesDef[] = [
  {
    slug: "le-reportage",
    name: "Le Reportage",
    description: "Enquêtes et récits de terrain à Goma et au Nord-Kivu.",
    icon: "podcasts",
    test: /reportage/i,
  },
  {
    slug: "galerie-des-stars",
    name: "Galerie des Stars",
    description: "Rencontres avec les artistes et talents du Kivu.",
    icon: "star",
    test: /galerie\s*des\s*stars/i,
  },
  {
    slug: "bulletins",
    name: "Bulletins d'information",
    description: "Les bulletins d'information réguliers de la rédaction.",
    icon: "newspaper",
    test: /bulletin/i,
  },
  {
    slug: "magazine-sportif",
    name: "Magazine Sportif",
    description: "L'actualité du sport, du football local aux compétitions.",
    icon: "sports_soccer",
    test: /\bsport/i,
  },
  {
    slug: "magazine",
    name: "Le Magazine",
    description: "Magazines thématiques : société, paix et cohésion.",
    icon: "auto_stories",
    test: /magazine/i,
  },
  {
    slug: "portraits",
    name: "Portraits & Rencontres",
    description: "Entretiens et portraits d'acteurs de la vie locale.",
    icon: "record_voice_over",
    test: /^$/,
  },
];

const OTHER = seriesDefs[seriesDefs.length - 1];

export function seriesOf(episode: Episode): SeriesDef {
  const hay = `${episode.title} ${episode.description}`;
  return seriesDefs.find((s) => s.test.source !== "^$" && s.test.test(hay)) ?? OTHER;
}

export function seriesBySlug(slug: string): SeriesDef | undefined {
  return seriesDefs.find((s) => s.slug === slug);
}

/** Removes trailing timestamps, file extensions and redundant series prefix. */
export function cleanEpisodeTitle(episode: Episode): string {
  let t = episode.title
    .replace(/\.(mp3|m4a|wav|aac)\b/gi, "")
    .replace(/[_\s]\d{6}$/, "")
    .replace(/\s*\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) t = episode.title.trim();
  return t;
}

export type SeriesGroup = SeriesDef & {
  episodes: Episode[];
  image: string | null;
  latest: string;
};

export function groupBySeries(episodes: Episode[]): SeriesGroup[] {
  const map = new Map<string, Episode[]>();
  for (const ep of episodes) {
    const def = seriesOf(ep);
    const list = map.get(def.slug) ?? [];
    list.push(ep);
    map.set(def.slug, list);
  }
  return seriesDefs
    .filter((def) => map.has(def.slug))
    .map((def) => {
      const list = (map.get(def.slug) ?? []).slice().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      return {
        ...def,
        episodes: list,
        image: list.find((e) => e.image)?.image ?? null,
        latest: list[0]?.date ?? "",
      };
    })
    .sort((a, b) => new Date(b.latest).getTime() - new Date(a.latest).getTime());
}
