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
  setRate: (r: number) => void;
  setQuality: (q: Quality) => void;
  play: (track: Track) => void;
  toggle: (track?: Track) => void;
  stop: () => void;
  seek: (seconds: number) => void;
  skip: (delta: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
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
  const resumeAtRef = useRef(0);

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

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !track) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.subtitle,
        album: "GOMA WEBRADIO",
        artwork: [{ src: track.artwork ?? "/icon-512.png", sizes: "512x512", type: "image/png" }],
      });
      navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
      navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    } catch { /* ignore */ }
  }, [track]);

  const value = useMemo<PlayerState>(() => ({
    track, playing, loading, volume, muted, progress, duration, quality, rate, setRate,
    setQuality, play, toggle, stop, seek, skip, setVolume, toggleMute,
  }), [track, playing, loading, volume, muted, progress, duration, quality, rate, setRate, setQuality, play, toggle, stop, seek, skip, setVolume, toggleMute]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
