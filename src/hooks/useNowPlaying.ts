import { useEffect, useState } from "react";

const META_URL = "https://api.zeno.fm/mounts/metadata/subscribe/4d61wprrp7zuv";

/**
 * Titre en cours de diffusion sur le flux Zeno (SSE, client uniquement).
 * Retourne null si l'information n'est pas disponible.
 */
export function useNowPlaying(): string | null {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;
    let source: EventSource | null = null;
    try {
      source = new EventSource(META_URL);
    } catch {
      return;
    }
    const onMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as { streamTitle?: string };
        const next = payload.streamTitle?.trim();
        setTitle(next && next.length > 1 ? next : null);
      } catch {
        /* ignore */
      }
    };
    source.addEventListener("message", onMessage);
    source.addEventListener("error", () => setTitle((t) => t));
    return () => {
      source?.removeEventListener("message", onMessage);
      source?.close();
    };
  }, []);

  return title;
}
