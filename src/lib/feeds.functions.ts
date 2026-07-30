import { createServerFn } from "@tanstack/react-start";
import type { Article, PodcastShow } from "./feeds.types";

export const getArticles = createServerFn({ method: "GET" })
  .inputValidator((data: { page?: number; search?: string; perPage?: number }) => data ?? {})
  .handler(async ({ data }): Promise<Article[]> => {
    const { fetchArticles } = await import("./feeds.server");
    return fetchArticles(data ?? {});
  });

export const getArticle = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<Article | null> => {
    const { fetchArticle } = await import("./feeds.server");
    return fetchArticle(data.slug);
  });

export const getPodcast = createServerFn({ method: "GET" }).handler(
  async (): Promise<PodcastShow> => {
    const { fetchPodcast } = await import("./feeds.server");
    return fetchPodcast();
  },
);
