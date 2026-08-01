import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={"animate-pulse rounded-xl bg-panel2 " + className} aria-hidden />;
}

export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border border-line bg-panel p-3">
          <Skeleton className="h-20 w-24 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-40 shrink-0 space-y-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ErrorRetry({
  message = "Contenu indisponible pour le moment.",
  onRetry,
  busy,
}: {
  message?: string;
  onRetry: () => void;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-panel p-6 text-center shadow-soft">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blood/15 text-blood">
        <span className="material-symbols-outlined">cloud_off</span>
      </span>
      <p className="text-sm text-inkmute">{message}</p>
      <button
        onClick={onRetry}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-blood px-5 py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
      >
        <span className={"material-symbols-outlined " + (busy ? "animate-spin" : "")} style={{ fontSize: 18 }}>
          {busy ? "progress_activity" : "refresh"}
        </span>
        Réessayer
      </button>
    </div>
  );
}

export function AsyncSection({
  isPending,
  isError,
  isFetching,
  onRetry,
  skeleton,
  errorMessage,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  isFetching?: boolean;
  onRetry: () => void;
  skeleton: ReactNode;
  errorMessage?: string;
  children: ReactNode;
}) {
  if (isPending) return <>{skeleton}</>;
  if (isError) return <ErrorRetry message={errorMessage} onRetry={onRetry} busy={isFetching} />;
  return <>{children}</>;
}
