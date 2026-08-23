import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { categoriesQuery } from "@/lib/queries";
import { Skeleton } from "@/components/Async";

/** Tiroir des catégories : s'ouvre vers la gauche depuis le bord droit. */
export function CategoryDrawer({
  open,
  onClose,
  activeSlug,
}: {
  open: boolean;
  onClose: () => void;
  activeSlug?: string;
}) {
  const catsQ = useQuery({ ...categoriesQuery(), enabled: open });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={
          "fixed inset-0 z-[60] bg-brand-deep/50 backdrop-blur-[2px] transition-opacity duration-300 " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />
      <aside
        role="dialog"
        aria-label="Catégories"
        aria-hidden={!open}
        className={
          "fixed right-0 top-0 z-[70] flex h-full w-[82%] max-w-xs flex-col border-l border-line bg-panel shadow-lift transition-transform duration-300 ease-out " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-4">
          <div className="min-w-0">
            <p className="font-display text-base font-extrabold text-ink">Catégories</p>
            <p className="truncate text-xs text-inkmute">Parcourir les rubriques</p>
          </div>
          <button
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel2 text-ink active:scale-95"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <Link
            to="/articles"
            search={{ page: 1 }}
            onClick={onClose}
            className={
              "mb-2 flex items-center gap-3 rounded-2xl border border-line px-3 py-3 text-sm font-bold active:scale-[0.99] " +
              (!activeSlug ? "bg-brand/15 text-brand" : "bg-panel2 text-ink")
            }
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>feed</span>
            Toutes les actualités
          </Link>

          {catsQ.isPending && (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {catsQ.isError && (
            <button
              onClick={() => void catsQ.refetch()}
              className="w-full rounded-2xl border border-line bg-panel2 px-3 py-3 text-sm font-bold text-ink"
            >
              Réessayer
            </button>
          )}

          <div className="space-y-1.5">
            {(catsQ.data ?? []).map((c) => (
              <Link
                key={c.id}
                to="/categories/$slug"
                params={{ slug: c.slug }}
                search={{ page: 1 }}
                onClick={onClose}
                className={
                  "flex items-center justify-between gap-2 rounded-2xl px-3 py-3 text-sm font-semibold active:scale-[0.99] " +
                  (activeSlug === c.slug ? "bg-brand/15 text-brand" : "text-ink hover:bg-panel2")
                }
              >
                <span className="min-w-0 truncate">{c.name}</span>
                <span className="shrink-0 rounded-full bg-panel2 px-2 py-0.5 text-[11px] font-bold text-inkmute">
                  {c.count}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
