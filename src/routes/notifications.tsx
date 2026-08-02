import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import { SmartImage } from "@/components/SmartImage";
import { TimeAgo } from "@/components/TimeAgo";
import { CardListSkeleton, ErrorRetry } from "@/components/Async";
import { useNotifications } from "@/hooks/useNotifications";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
  head: () => ({
    meta: [
      { title: "Notifications — GOMA WEBRADIO" },
      { name: "description", content: "Alertes info, nouveaux articles et nouveaux épisodes de podcast." },
      { property: "og:title", content: "Notifications — GOMA WEBRADIO" },
      { property: "og:description", content: "Vos dernières alertes Goma Webradio." },
    ],
    links: [{ rel: "canonical", href: "/notifications" }],
  }),
});

function Notifications() {
  const { items, isPending, isError, isFetching, refetch, markAllRead, isUnread, unreadCount, enablePush } =
    useNotifications();

  return (
    <Screen title="Notifications" back>
      <div className="flex flex-wrap items-center gap-2 pt-4">
        <button
          onClick={() => void enablePush()}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notifications_active</span>
          Activer les alertes
        </button>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-2 text-xs font-bold text-ink active:scale-95 disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>done_all</span>
          Tout marquer comme lu
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {isPending ? (
          <CardListSkeleton rows={4} />
        ) : isError ? (
          <ErrorRetry message="Notifications indisponibles." onRetry={refetch} busy={isFetching} />
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-inkmute">
            Aucune notification pour le moment.
          </p>
        ) : (
          items.map((n) => {
            const fresh = isUnread(n);
            return (
              <Link
                key={n.id}
                to={n.href}
                className={
                  "flex gap-3 rounded-2xl border p-3 shadow-soft active:scale-[0.99] " +
                  (fresh ? "border-blood/40 bg-blood/5" : "border-line bg-panel")
                }
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-panel2">
                  <SmartImage src={n.image} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-tl-xl bg-brand text-white">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{n.icon}</span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink">{n.title}</p>
                    {fresh && <span className="h-2 w-2 shrink-0 rounded-full bg-blood" />}
                  </div>
                  <p className="line-clamp-2 text-xs text-inkmute">{n.desc}</p>
                  <p className="mt-1 text-[11px] text-inkmute"><TimeAgo date={n.date} /></p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </Screen>
  );
}
