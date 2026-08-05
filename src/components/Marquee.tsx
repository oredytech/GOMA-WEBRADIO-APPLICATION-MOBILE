import { useEffect, useRef, useState } from "react";

/**
 * Affiche un texte sur une ligne ; s'il est trop long, il défile en boucle.
 */
export function Marquee({
  text,
  className = "",
  speed = 40,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const [overflow, setOverflow] = useState(false);
  const [duration, setDuration] = useState(12);

  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const inner = innerRef.current;
      if (!wrap || !inner) return;
      const over = inner.scrollWidth > wrap.clientWidth + 4;
      setOverflow(over);
      if (over) setDuration(Math.max(8, (inner.scrollWidth + 48) / speed));
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [text, speed]);

  return (
    <div ref={wrapRef} className={"relative w-full overflow-hidden " + className}>
      {overflow ? (
        <div className="flex w-max animate-marquee" style={{ animationDuration: `${duration}s` }}>
          <span ref={innerRef} className="whitespace-nowrap pr-12">{text}</span>
          <span aria-hidden className="whitespace-nowrap pr-12">{text}</span>
        </div>
      ) : (
        <span ref={innerRef} className="block truncate whitespace-nowrap">{text}</span>
      )}
    </div>
  );
}
