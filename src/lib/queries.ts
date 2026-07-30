import { queryOptions } from "@tanstack/react-query";
import { getArticle, getArticles, getPodcast } from "./feeds.functions";

export const articlesQuery = (opts: { page?: number; search?: string; perPage?: number } = {}) =>
  queryOptions({
    queryKey: ["articles", opts],
    queryFn: () => getArticles({ data: opts }),
    staleTime: 5 * 60_000,
  });

export const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["article", slug],
    queryFn: () => getArticle({ data: { slug } }),
    staleTime: 5 * 60_000,
  });

export const podcastQuery = () =>
  queryOptions({
    queryKey: ["podcast"],
    queryFn: () => getPodcast(),
    staleTime: 10 * 60_000,
  });
