import { queryOptions } from "@tanstack/react-query";
import {
  getArticle,
  getArticles,
  getArticlesPage,
  getCategories,
  getCategory,
  getComments,
  getPodcast,
  getTeam,
  getVideos,
} from "./feeds.functions";

export const articlesQuery = (opts: { page?: number; search?: string; perPage?: number } = {}) =>
  queryOptions({
    queryKey: ["articles", opts],
    queryFn: () => getArticles({ data: opts }),
    staleTime: 5 * 60_000,
  });

export const articlesPageQuery = (
  opts: { page?: number; perPage?: number; search?: string; categoryId?: number } = {},
) =>
  queryOptions({
    queryKey: ["articles-page", opts],
    queryFn: () => getArticlesPage({ data: opts }),
    staleTime: 5 * 60_000,
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    staleTime: 30 * 60_000,
  });

export const categoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => getCategory({ data: { slug } }),
    staleTime: 30 * 60_000,
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

export const commentsQuery = (postId: number) =>
  queryOptions({
    queryKey: ["comments", postId],
    queryFn: () => getComments({ data: { postId } }),
    staleTime: 60_000,
  });

export const teamQuery = () =>
  queryOptions({
    queryKey: ["team"],
    queryFn: () => getTeam(),
    staleTime: 30 * 60_000,
  });

export const videosQuery = () =>
  queryOptions({
    queryKey: ["videos"],
    queryFn: () => getVideos(),
    staleTime: 15 * 60_000,
  });
