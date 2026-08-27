import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { articlesQuery, podcastQuery, videosQuery } from "@/lib/queries";
import {
  disableFirebasePush,
  enableFirebasePush,
  getBrowserMessaging,
  PUSH_ENABLED_KEY,
  PUSH_SETTING_EVENT,
} from "@/lib/firebase";
import { onMessage } from "firebase/messaging";

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
const FCM_TOKEN_KEY = "gw-fcm-token";
const EVT = "gw-notif";

function readSeen(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(SEEN_KEY);
  return raw ? Number(raw) || 0 : 0;
}

function readPushEnabled(): boolean {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  return (
    Notification.permission === "granted" && window.localStorage.getItem(PUSH_ENABLED_KEY) !== "0"
  );
}

export function useNotifications() {
  const articlesQ = useQuery(articlesQuery({ perPage: 10 }));
  const podcastQ = useQuery(podcastQuery());
  const videosQ = useQuery(videosQuery());
  const [seen, setSeen] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [pushStatus, setPushStatus] = useState<NotificationPermission | "unsupported" | "default">(
    "default",
  );
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setSeen(readSeen());
    sync();
    setHydrated(true);
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    const syncPush = () => setPushEnabled(readPushEnabled());
    syncPush();
    window.addEventListener(PUSH_SETTING_EVENT, syncPush);
    window.addEventListener("storage", syncPush);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener(PUSH_SETTING_EVENT, syncPush);
      window.removeEventListener("storage", syncPush);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (typeof Notification === "undefined") {
      setPushStatus("unsupported");
      return;
    }
    setPushStatus(Notification.permission);
    const token = window.localStorage.getItem(FCM_TOKEN_KEY);
    if (!token || Notification.permission !== "granted") return;

    let unsubscribe: (() => void) | undefined;
    void getBrowserMessaging().then((messaging) => {
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? "GOMA WEBRADIO";
        const body = payload.notification?.body ?? "Une nouvelle information est disponible.";
        const notificationTag =
          payload.data?.notification_id ?? `goma-article-${payload.data?.article_id ?? "default"}`;
        if (Notification.permission !== "granted") return;
        void navigator.serviceWorker
          .getRegistration("/firebase-messaging-sw.js")
          .then((registration) => {
            if (registration) {
              void registration.getNotifications({ tag: notificationTag }).then((notifications) => {
                notifications.forEach((notification) => notification.close());
                return registration.showNotification(title, {
                  body,
                  icon: "/logo.png",
                  badge: "/notification-badge.png",
                  image: payload.data?.image || undefined,
                  tag: notificationTag,
                  renotify: false,
                  data: { url: payload.data?.url ?? "/notifications" },
                });
              });
              return;
            }
            const notification = new Notification(title, {
              body,
              icon: "/logo.png",
              tag: notificationTag,
            });
            notification.onclick = () => {
              window.location.assign(payload.data?.url ?? "/notifications");
            };
          });
      });
    });
    return () => unsubscribe?.();
  }, [hydrated, fcmEnabled]);

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
    if (!pushEnabled) return;
    let pushed: string[] = [];
    try {
      pushed = JSON.parse(window.localStorage.getItem(PUSHED_KEY) ?? "[]") as string[];
    } catch {
      /* ignore */
    }
    const fresh = unread.filter((n) => !pushed.includes(n.id)).slice(0, 3);
    if (!fresh.length) return;
    for (const n of fresh) {
      try {
        new Notification(n.title, { body: n.desc, icon: "/logo.png", tag: n.id });
      } catch {
        /* ignore */
      }
    }
    window.localStorage.setItem(
      PUSHED_KEY,
      JSON.stringify([...fresh.map((n) => n.id), ...pushed].slice(0, 60)),
    );
  }, [unread, hydrated, pushEnabled]);

  const markAllRead = useCallback(() => {
    const now = Date.now();
    window.localStorage.setItem(SEEN_KEY, String(now));
    setSeen(now);
    window.dispatchEvent(new Event(EVT));
  }, []);

  const enablePush = useCallback(async () => {
    try {
      const status = await enableFirebasePush();
      setPushStatus(status);
      if (status === "granted") {
        setFcmEnabled(true);
        setPushEnabled(true);
      }
      return status;
    } catch {
      return "unsupported" as const;
    }
  }, []);

  const disablePush = useCallback(async () => {
    await disableFirebasePush();
    setPushEnabled(false);
    setFcmEnabled(false);
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
    pushStatus,
    pushEnabled,
    disablePush,
    isUnread: (n: NotificationItem) => new Date(n.date).getTime() > seen,
  };
}
