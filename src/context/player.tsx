import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export const RADIO_STREAM = "https://stream.zeno.fm/4d61wprrp7zuv";

export type Track = {
  id: string;
  kind: "radio" | "podcast";
  title: string;
  subtitle: string;
  artwork: string | null;
  src: string;
};

export type Quality = "Auto" | "Normale" | "Haute";

export const LIVE_TRACK: Track = {
  id: "live",
  kind: "radio",
  title: "GOMA WEBRADIO — En direct",
  subtitle: "Fasi ya ndule na infos za palais",
  artwork: null,
  src: RADIO_STREAM,
};

type Persisted = {
  track: Track | null;
  progress: number;
  volume: number;
  muted: boolean;
  quality: Quality;
  rate: number;
  wasPlaying: boolean;
};

const KEY = "gw-player-state";


function readPersisted(): Partial<Persisted> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Partial<Persisted>;
  } catch {
    return {};
  }
}

type PlayerState = {
  track: Track | null;
  playing: boolean;
  loading: boolean;
  volume: number;
  muted: boolean;
  progress: number;
  duration: number;
  quality: Quality;
  rate: number;
  queue: Track[];
  hasNext: boolean;
  hasPrev: boolean;
  setQueue: (tracks: Track[]) => void;
  playNext: () => void;
  playPrev: () => void;
  setRate: (r: number) => void;
  setQuality: (q: Quality) => void;
  play: (track: Track) => void;
  toggle: (track?: Track) => void;
  stop: () => void;
  seek: (seconds: number) => void;
  skip: (delta: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setFavoriteHandler: (fn: ((track: Track) => void) | null) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [quality, setQualityState] = useState<Quality>("Auto");
  const [rate, setRateState] = useState(1);
  const [queue, setQueueState] = useState<Track[]>([]);
  const resumeAtRef = useRef(0);
  const favHandlerRef = useRef<((track: Track) => void) | null>(null);


  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    // Restauration de l'état persisté
    const saved = readPersisted();
    const savedVolume = typeof saved.volume === "number" ? saved.volume : 0.9;
    audio.volume = savedVolume;
    audio.muted = Boolean(saved.muted);
    setVolumeState(savedVolume);
    setMuted(Boolean(saved.muted));
    if (saved.quality) setQualityState(saved.quality);
    if (typeof saved.rate === "number" && saved.rate > 0) {
      audio.playbackRate = saved.rate;
      setRateState(saved.rate);
    }
    if (saved.track) {
      setTrack(saved.track);
      if (saved.track.kind === "podcast") {
        audio.src = saved.track.src;
        resumeAtRef.current = saved.progress ?? 0;
        setProgress(saved.progress ?? 0);
      } else {
        audio.src = saved.track.src;
      }
    }

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      if (resumeAtRef.current > 0) {
        audio.currentTime = resumeAtRef.current;
        resumeAtRef.current = 0;
      }
    };
    const onPlay = () => { setPlaying(true); setLoading(false); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onEnded = () => { setPlaying(false); setProgress(0); };
    const onError = () => { setLoading(false); setPlaying(false); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("playing", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("playing", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // Persistance de l'état du lecteur
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: Persisted = {
      track,
      progress: track?.kind === "podcast" ? progress : 0,
      volume,
      muted,
      quality,
      rate,
      wasPlaying: playing,
    };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(payload));
    } catch { /* quota */ }
  }, [track, progress, volume, muted, quality, rate, playing]);

  const play = useCallback((next: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (track?.id !== next.id) {
      audio.src = next.kind === "radio" ? `${next.src}?t=${Date.now()}` : next.src;
      setProgress(0);
      setDuration(0);
      setTrack(next);
    } else if (!audio.src) {
      audio.src = next.kind === "radio" ? `${next.src}?t=${Date.now()}` : next.src;
    }
    setLoading(true);
    
    void audio.play().catch(() => setLoading(false));
  }, [track?.id]);

  const toggle = useCallback((next?: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = next ?? track;
    if (!target) return;
    if (track?.id === target.id && !audio.paused) {
      audio.pause();
      return;
    }
    play(target);
  }, [play, track]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    setTrack(null);
    setPlaying(false);
    setProgress(0);
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || track?.kind === "radio") return;
    audio.currentTime = seconds;
    setProgress(seconds);
  }, [track?.kind]);

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio || track?.kind === "radio") return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta));
  }, [track?.kind]);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    setVolumeState(v);
    if (audio) {
      audio.volume = v;
      audio.muted = v === 0;
    }
    setMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !audio.muted;
    audio.muted = next;
    setMuted(next);
  }, []);

  const setQuality = useCallback((q: Quality) => setQualityState(q), []);

  const setRate = useCallback((r: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = r;
    setRateState(r);
  }, []);

  // ---- File d'écoute (permet de changer d'épisode depuis n'importe quel écran) ----
  const setQueue = useCallback((tracks: Track[]) => {
    setQueueState((prev) => {
      if (prev.length === tracks.length && prev.every((t, i) => t.id === tracks[i]?.id)) return prev;
      return tracks;
    });
  }, []);

  const queueIndex = track ? queue.findIndex((t) => t.id === track.id) : -1;
  const hasPrev = queueIndex > 0;
  const hasNext = queueIndex >= 0 && queueIndex < queue.length - 1;

  const playNext = useCallback(() => {
    if (queueIndex >= 0 && queueIndex < queue.length - 1) play(queue[queueIndex + 1]);
  }, [play, queue, queueIndex]);

  const playPrev = useCallback(() => {
    if (queueIndex > 0) play(queue[queueIndex - 1]);
  }, [play, queue, queueIndex]);

  const setFavoriteHandler = useCallback((fn: ((track: Track) => void) | null) => {
    favHandlerRef.current = fn;
  }, []);

  // ---- Media Session : casque, écran verrouillé, notification ----
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !track) return;
    const ms = navigator.mediaSession;
    const safe = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { ms.setActionHandler(action, handler); } catch { /* non pris en charge */ }
    };
    try {
      ms.metadata = new MediaMetadata({
        title: track.title,
        artist: track.subtitle,
        album: "GOMA WEBRADIO",
        artwork: [
          { src: track.artwork ?? "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: track.artwork ?? "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
    } catch { /* ignore */ }

    safe("play", () => { void audioRef.current?.play(); });
    safe("pause", () => audioRef.current?.pause());
    safe("stop", () => stop());
    safe("previoustrack", hasPrev ? () => playPrev() : null);
    safe("nexttrack", hasNext ? () => playNext() : null);
    if (track.kind === "podcast") {
      safe("seekbackward", (d) => skip(-(d.seekOffset ?? 15)));
      safe("seekforward", (d) => skip(d.seekOffset ?? 30));
      safe("seekto", (d) => { if (typeof d.seekTime === "number") seek(d.seekTime); });
    } else {
      safe("seekbackward", null);
      safe("seekforward", null);
      safe("seekto", null);
    }
    
    // "Favori" depuis le casque / écran verrouillé
    safe(
      "hangup" as MediaSessionAction,
      () => favHandlerRef.current?.(track),
    );

    return () => {
      (["play", "pause", "stop", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"] as MediaSessionAction[])
        .forEach((a) => { try { ms.setActionHandler(a, null); } catch { /* ignore */ } });
    };
  }, [track, hasPrev, hasNext, playNext, playPrev, seek, skip, stop]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = playing ? "playing" : track ? "paused" : "none";
      if (track?.kind === "podcast" && duration > 0 && Number.isFinite(duration)) {
        navigator.mediaSession.setPositionState?.({
          duration,
          position: Math.min(progress, duration),
          playbackRate: rate,
        });
      }
    } catch { /* ignore */ }
  }, [playing, track, duration, progress, rate]);


  const value = useMemo<PlayerState>(() => ({
    track, playing, loading, volume, muted, progress, duration, quality, rate, setRate,
    queue, hasNext, hasPrev, setQueue, playNext, playPrev,
    setFavoriteHandler,
    setQuality, play, toggle, stop, seek, skip, setVolume, toggleMute,
  }), [track, playing, loading, volume, muted, progress, duration, quality, rate, setRate, queue, hasNext, hasPrev, setQueue, playNext, playPrev, setFavoriteHandler, setQuality, play, toggle, stop, seek, skip, setVolume, toggleMute]);


  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
