import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { MiniPlayer } from "./MiniPlayer";

export function Screen({
  children,
  title,
  back,
  transparentBar,
  hideTopBar,
  action,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean;
  transparentBar?: boolean;
  hideTopBar?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      {!hideTopBar && <TopBar title={title} back={back} transparent={transparentBar} action={action} />}
      <main className="mx-auto w-full max-w-2xl px-4 pb-44">{children}</main>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="truncate font-display text-lg font-extrabold tracking-tight text-ink">{title}</h2>
      {actionLabel && (
        <button
          onClick={onAction}
          className="shrink-0 text-xs font-bold uppercase tracking-wide text-brand active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
