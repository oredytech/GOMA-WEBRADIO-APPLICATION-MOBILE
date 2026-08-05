import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { articlesQuery, podcastQuery, videosQuery } from "@/lib/queries";

export type NotificationItem = {
  id: string;
  kind: "article" | "episode" | "video";
  icon: string;
  title: string;
  desc: string;
  date: string;
  href: string;
  image: string | null;
};

const SEEN_KEY = "gw-notif-seen";
const PUSHED_KEY = "gw-notif-pushed";
const EVT = "gw-notif";

function readSeen(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(SEEN_KEY);
  return raw ? Number(raw) || 0 : 0;
}

export function useNotifications() {
  const articlesQ = useQuery(articlesQuery({ perPage: 10 }));
  const podcastQ = useQuery(podcastQuery());
  const videosQ = useQuery(videosQuery());
  const [seen, setSeen] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setSeen(readSeen());
    sync();
    setHydrated(true);
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const items = useMemo<NotificationItem[]>(() => {
    const articles: NotificationItem[] = (articlesQ.data ?? []).slice(0, 12).map((a) => ({
      id: `article-${a.id}`,
      kind: "article",
      icon: "campaign",
      title: "Nouvel article",
      desc: a.title,
      date: a.date,
      href: `/articles/${a.slug}`,
      image: a.image,
    }));
    const episodes: NotificationItem[] = (podcastQ.data?.episodes ?? []).slice(0, 12).map((e) => ({
      id: `episode-${e.id}`,
      kind: "episode",
      icon: "podcasts",
      title: "Nouvel épisode disponible",
      desc: e.title,
      date: e.date,
      href: `/podcasts/${e.id}`,
      image: e.image,
    }));
    const videos: NotificationItem[] = (videosQ.data ?? []).slice(0, 12).map((v) => ({
      id: `video-${v.id}`,
      kind: "video",
      icon: "smart_display",
      title: "Nouvelle vidéo publiée",
      desc: v.title,
      date: v.date,
      href: "/videos",
      image: v.thumbnail,
    }));
    return [...articles, ...episodes, ...videos]
      .filter((n) => !Number.isNaN(new Date(n.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 25);
  }, [articlesQ.data, podcastQ.data, videosQ.data]);

  const unread = useMemo(
    () => (hydrated ? items.filter((n) => new Date(n.date).getTime() > seen) : []),
    [items, seen, hydrated],
  );

  // Notification système (si l'utilisateur a donné son accord)
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    let pushed: string[] = [];
    try {
      pushed = JSON.parse(window.localStorage.getItem(PUSHED_KEY) ?? "[]") as string[];
    } catch { /* ignore */ }
    const fresh = unread.filter((n) => !pushed.includes(n.id)).slice(0, 3);
    if (!fresh.length) return;
    for (const n of fresh) {
      try {
        new Notification(n.title, { body: n.desc, icon: "/icon-192.png", tag: n.id });
      } catch { /* ignore */ }
    }
    window.localStorage.setItem(
      PUSHED_KEY,
      JSON.stringify([...fresh.map((n) => n.id), ...pushed].slice(0, 60)),
    );
  }, [unread, hydrated]);

  const markAllRead = useCallback(() => {
    const now = Date.now();
    window.localStorage.setItem(SEEN_KEY, String(now));
    setSeen(now);
    window.dispatchEvent(new Event(EVT));
  }, []);

  const enablePush = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported" as const;
    const res = await Notification.requestPermission();
    return res;
  }, []);

  return {
    items,
    unread,
    unreadCount: unread.length,
    isPending: articlesQ.isPending || podcastQ.isPending || videosQ.isPending,
    isError: articlesQ.isError && podcastQ.isError && videosQ.isError,
    isFetching: articlesQ.isFetching || podcastQ.isFetching || videosQ.isFetching,
    refetch: () => {
      void articlesQ.refetch();
      void podcastQ.refetch();
      void videosQ.refetch();
    },
    markAllRead,
    enablePush,
    isUnread: (n: NotificationItem) => new Date(n.date).getTime() > seen,
  };
}
