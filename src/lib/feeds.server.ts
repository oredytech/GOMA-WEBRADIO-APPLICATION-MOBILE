/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Article, PodcastShow } from "./feeds.types";

const WP = "https://gomawebradio.com/wp-json/wp/v2";
const RSS =
  "https://podcast.zenomedia.com/api/public/podcasts/e422f99f-db57-40c3-a92e-778a15e5c2bb/rss";

function decode(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&#8217;|&rsquo;|&#039;|&apos;/g, "\u2019")
    .replace(/&#8216;|&lsquo;/g, "\u2018")
    .replace(/&#8220;|&ldquo;/g, "\u201c")
    .replace(/&#8221;|&rdquo;/g, "\u201d")
    .replace(/&#8230;|&hellip;/g, "\u2026")
    .replace(/&#8211;|&ndash;/g, "\u2013")
    .replace(/&#8212;|&mdash;/g, "\u2014")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`WordPress request failed [${res.status}]`);
  const text = (await res.text()).replace(/^\uFEFF/, "");
  return JSON.parse(text);
}

function mapPost(p: any): Article {
  const embedded = p._embedded ?? {};
  const media = embedded["wp:featuredmedia"]?.[0];
  const terms: any[] = (embedded["wp:term"] ?? []).flat();
  const plain = decode(p.content?.rendered ?? "");
  return {
    id: p.id,
    slug: p.slug,
    title: decode(p.title?.rendered ?? ""),
    excerpt: decode(p.excerpt?.rendered ?? "").slice(0, 200),
    content: p.content?.rendered ?? "",
    date: p.date,
    author: embedded.author?.[0]?.name ?? "Goma Webradio",
    image: media?.source_url ?? null,
    category: terms.find((t) => t?.taxonomy === "category")?.name ?? "Actualité",
    readingTime: Math.max(1, Math.round(plain.split(" ").length / 200)),
    link: p.link,
  };
}

export async function fetchArticles(opts: {
  page?: number;
  search?: string;
  perPage?: number;
}): Promise<Article[]> {
  const params = new URLSearchParams({
    _embed: "1",
    per_page: String(Math.min(opts.perPage ?? 10, 20)),
    page: String(opts.page ?? 1),
  });
  if (opts.search) params.set("search", opts.search);
  try {
    const posts = (await getJson(`${WP}/posts?${params.toString()}`)) as any[];
    return Array.isArray(posts) ? posts.map(mapPost) : [];
  } catch (error) {
    console.error("fetchArticles failed", error);
    return [];
  }
}

export async function fetchArticle(slug: string): Promise<Article | null> {
  try {
    const posts = (await getJson(
      `${WP}/posts?_embed=1&slug=${encodeURIComponent(slug)}`,
    )) as any[];
    return posts?.[0] ? mapPost(posts[0]) : null;
  } catch (error) {
    console.error("fetchArticle failed", error);
    return null;
  }
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  if (!m) return "";
  return decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, ""));
}

function attr(block: string, name: string, key: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*${key}="([^"]+)"`));
  return m ? m[1] : null;
}

export async function fetchPodcast(): Promise<PodcastShow> {
  const empty: PodcastShow = {
    title: "LE REPORTAGE",
    description: "",
    image: null,
    author: "Goma Webradio",
    episodes: [],
  };
  try {
    const res = await fetch(RSS);
    if (!res.ok) throw new Error(`RSS request failed [${res.status}]`);
    const xml = await res.text();
    const head = xml.split("<item>")[0];
    const channelImage = attr(head, "itunes:image", "href");
    const items = xml.split("<item>").slice(1).map((raw) => raw.split("</item>")[0]);
    return {
      title: tag(head, "title") || empty.title,
      description: tag(head, "description"),
      image: channelImage,
      author: tag(head, "itunes:author") || empty.author,
      episodes: items.map((block, i) => ({
        id: tag(block, "guid") || String(i),
        title: tag(block, "title"),
        description: tag(block, "description"),
        audio: attr(block, "enclosure", "url") ?? "",
        date: tag(block, "pubDate"),
        duration: tag(block, "itunes:duration") || "--:--",
        image: attr(block, "itunes:image", "href") ?? channelImage,
        author: tag(block, "itunes:author") || "Goma Webradio",
      })),
    };
  } catch (error) {
    console.error("fetchPodcast failed", error);
    return empty;
  }
}
