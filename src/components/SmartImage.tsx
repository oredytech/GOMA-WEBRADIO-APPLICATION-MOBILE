import { useEffect, useState } from "react";
import logo from "@/assets/logo.png.asset.json";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  loading?: "lazy" | "eager";
};

/**
 * Image resiliente : évite les images cassées en production
 * (hotlinking WordPress bloqué, referrer, URL absente) en repliant
 * sur le logo de la radio.
 */
export function SmartImage({ src, alt, className, fallbackClassName, loading = "lazy" }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const broken = !src || failed;

  return (
    <img
      src={broken ? logo.url : src}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      crossOrigin={undefined}
      onError={() => setFailed(true)}
      className={
        broken
          ? (fallbackClassName ?? "h-full w-full bg-brand-deep object-contain p-4")
          : className
      }
    />
  );
}
