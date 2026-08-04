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
    .replace(/<[^>]*>/g, " ")
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
  const posts = (await getJson(`${WP}/posts?${params.toString()}`)) as any[];
  return Array.isArray(posts) ? posts.map(mapPost) : [];
}

export async function fetchArticlesPage(opts: {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: number;
}): Promise<import("./feeds.types").ArticlePage> {
  const params = new URLSearchParams({
    _embed: "1",
    per_page: String(Math.min(opts.perPage ?? 10, 20)),
    page: String(Math.max(1, opts.page ?? 1)),
  });
  if (opts.search) params.set("search", opts.search);
  if (opts.categoryId) params.set("categories", String(opts.categoryId));
  const res = await fetch(`${WP}/posts?${params.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`WordPress request failed [${res.status}]`);
  const totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1") || 1;
  const total = Number(res.headers.get("x-wp-total") ?? "0") || 0;
  const posts = JSON.parse((await res.text()).replace(/^\uFEFF/, "")) as any[];
  return {
    items: Array.isArray(posts) ? posts.map(mapPost) : [],
    page: Math.max(1, opts.page ?? 1),
    totalPages,
    total,
  };
}

export async function fetchCategories(): Promise<import("./feeds.types").Category[]> {
  const data = (await getJson(
    `${WP}/categories?per_page=100&orderby=count&order=desc&hide_empty=1`,
  )) as any[];
  if (!Array.isArray(data)) return [];
  return data
    .filter((c) => c?.count > 0)
    .map((c) => ({ id: c.id, slug: c.slug, name: decode(c.name ?? ""), count: c.count ?? 0 }));
}

export async function fetchCategory(slug: string): Promise<import("./feeds.types").Category | null> {
  const data = (await getJson(`${WP}/categories?slug=${encodeURIComponent(slug)}`)) as any[];
  const c = data?.[0];
  return c ? { id: c.id, slug: c.slug, name: decode(c.name ?? ""), count: c.count ?? 0 } : null;
}

export async function fetchArticle(slug: string): Promise<Article | null> {
  const posts = (await getJson(
    `${WP}/posts?_embed=1&slug=${encodeURIComponent(slug)}`,
  )) as any[];
  return posts?.[0] ? mapPost(posts[0]) : null;
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
  {
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
  }
}

export async function fetchComments(postId: number): Promise<import("./feeds.types").Comment[]> {
  const res = await fetch(
    `${WP}/comments?post=${postId}&per_page=50&order=asc&orderby=date`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as any[];
  if (!Array.isArray(data)) return [];
  return data.map((c) => ({
    id: c.id,
    parent: c.parent ?? 0,
    author: decode(c.author_name ?? "Anonyme"),
    avatar: c.author_avatar_urls?.["48"] ?? null,
    date: c.date,
    content: decode(c.content?.rendered ?? ""),
  }));
}

export async function createComment(input: {
  post: number;
  author_name: string;
  author_email: string;
  content: string;
}): Promise<{ ok: boolean; status: "published" | "pending" | "error"; message: string }> {
  const res = await fetch(`${WP}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.text();
  if (!res.ok) {
    let message = "Impossible d'envoyer le commentaire pour le moment.";
    try {
      const parsed = JSON.parse(body);
      if (parsed?.code === "rest_comment_login_required")
        message = "Les commentaires sont réservés aux membres connectés sur gomawebradio.com.";
      else if (parsed?.message) message = decode(String(parsed.message));
    } catch { /* ignore */ }
    console.error(`WordPress comment failed [${res.status}]: ${body}`);
    return { ok: false, status: "error", message };
  }
  let pending = true;
  try {
    pending = JSON.parse(body)?.status !== "approved";
  } catch { /* ignore */ }
  return {
    ok: true,
    status: pending ? "pending" : "published",
    message: pending
      ? "Merci ! Votre commentaire est en attente de modération."
      : "Merci ! Votre commentaire est publié.",
  };
}

export async function fetchTeam(): Promise<import("./feeds.types").TeamMember[]> {
  const data = (await getJson(`${WP}/users?per_page=100&orderby=name&order=asc`)) as any[];
  if (!Array.isArray(data)) return [];
  return data.map((u) => ({
    id: u.id,
    name: decode(u.name ?? ""),
    role: decode(u.description ?? "") || "Journaliste",
    avatar: u.avatar_urls?.["96"] ?? u.avatar_urls?.["48"] ?? null,
    link: u.link ?? null,
    slug: u.slug ?? "",
  }));
}
