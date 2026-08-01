import { useEffect, useState } from "react";
import { LOGO_URL } from "@/lib/media";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  loading?: "lazy" | "eager";
};

/**
 * Image resiliente : squelette pendant le chargement, bouton "Réessayer"
 * en cas d'échec, repli sur le logo de la radio.
 */
export function SmartImage({ src, alt, className, fallbackClassName, loading = "lazy" }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(src ? "loading" : "error");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setStatus(src ? "loading" : "error");
    setAttempt(0);
  }, [src]);

  const broken = !src || status === "error";
  const url = broken ? LOGO_URL : attempt > 0 ? `${src}${src!.includes("?") ? "&" : "?"}r=${attempt}` : src!;

  return (
    <span className="relative block h-full w-full">
      {status === "loading" && (
        <span className="absolute inset-0 animate-pulse bg-panel2" aria-hidden />
      )}
      <img
        key={attempt}
        src={url}
        alt={alt}
        loading={loading}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
        className={
          broken
            ? (fallbackClassName ?? "h-full w-full bg-brand-deep object-contain p-4")
            : className
        }
      />
      {broken && src && (
        <button
          type="button"
          aria-label="Réessayer le chargement de l'image"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setStatus("loading");
            setAttempt((a) => a + 1);
          }}
          className="absolute bottom-1 left-1 flex h-8 items-center gap-1 rounded-full bg-ink/70 px-2 text-[11px] font-bold text-paper backdrop-blur active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
          Réessayer
        </button>
      )}
    </span>
  );
}
