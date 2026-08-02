import { createServerFn } from "@tanstack/react-start";
import type { Article, Comment, PodcastShow } from "./feeds.types";

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

export const getComments = createServerFn({ method: "GET" })
  .inputValidator((data: { postId: number }) => data)
  .handler(async ({ data }): Promise<Comment[]> => {
    const { fetchComments } = await import("./feeds.server");
    return fetchComments(data.postId);
  });

export const sendComment = createServerFn({ method: "POST" })
  .inputValidator((data: { postId: number; name: string; email: string; content: string }) => {
    const name = String(data?.name ?? "").trim();
    const email = String(data?.email ?? "").trim();
    const content = String(data?.content ?? "").trim();
    if (!Number.isFinite(data?.postId)) throw new Error("Article invalide.");
    if (name.length < 2) throw new Error("Merci d'indiquer votre nom.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("E-mail invalide.");
    if (content.length < 2 || content.length > 2000) throw new Error("Commentaire invalide.");
    return { postId: data.postId, name, email, content };
  })
  .handler(async ({ data }) => {
    const { createComment } = await import("./feeds.server");
    return createComment({
      post: data.postId,
      author_name: data.name,
      author_email: data.email,
      content: data.content,
    });
  });
