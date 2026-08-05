import { useEffect, useState } from "react";

const META_URL = "https://api.zeno.fm/mounts/metadata/subscribe/4d61wprrp7zuv";

export type NowPlaying = {
  /** Titre en cours de diffusion (null si indisponible). */
  title: string | null;
  /** Titre suivant, si le flux le communique. */
  next: string | null;
};

/**
 * Métadonnées du flux Zeno (SSE, client uniquement).
 */
export function useNowPlaying(): NowPlaying {
  const [state, setState] = useState<NowPlaying>({ title: null, next: null });

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;
    let source: EventSource | null = null;
    try {
      source = new EventSource(META_URL);
    } catch {
      return;
    }
    const clean = (v: unknown) => {
      const s = typeof v === "string" ? v.trim() : "";
      return s.length > 1 ? s : null;
    };
    const onMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as Record<string, unknown>;
        setState({
          title: clean(payload.streamTitle),
          next: clean(payload.nextTitle ?? payload.nextTrack ?? payload.next),
        });
      } catch {
        /* ignore */
      }
    };
    source.addEventListener("message", onMessage);
    return () => {
      source?.removeEventListener("message", onMessage);
      source?.close();
    };
  }, []);

  return state;
}
