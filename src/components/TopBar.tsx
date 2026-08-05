import { Link, useRouter } from "@tanstack/react-router";
import { LOGO_URL } from "@/lib/media";
import { useNotifications } from "@/hooks/useNotifications";

export function TopBar({
  title,
  back = false,
  transparent = false,
  action,
}: {
  title?: string;
  back?: boolean;
  transparent?: boolean;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  return (
    <header
      className={
        "sticky top-0 z-40 " +
        (transparent
          ? "bg-gradient-to-b from-paper/80 to-transparent backdrop-blur-[2px]"
          : "border-b border-line/70 bg-paper/90 backdrop-blur-xl")
      }
    >
      <div className="mx-auto grid h-14 max-w-2xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4">
        {back ? (
          <button
            aria-label="Retour"
            onClick={() => router.history.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-panel text-ink shadow-soft active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2">
            <img alt="GOMA WEBRADIO" src={LOGO_URL} className="h-8 w-8 rounded-lg object-contain" />
          </Link>
        )}

        <h1 className="truncate text-center font-display text-[17px] font-extrabold tracking-tight text-ink">
          {title ?? "GOMA WEBRADIO"}
        </h1>

        <div className="flex items-center justify-end gap-0.5">
          {action ?? (
            <>
              <Link
                to="/recherche"
                aria-label="Recherche"
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink active:scale-95"
              >
                <span className="material-symbols-outlined">search</span>
              </Link>
              <Link
                to="/notifications"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink active:scale-95"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex min-w-[18px] items-center justify-center rounded-full bg-blood px-1 text-[10px] font-extrabold leading-[18px] text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/more"
                aria-label="Plus"
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink active:scale-95"
              >
                <span className="material-symbols-outlined">menu</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
