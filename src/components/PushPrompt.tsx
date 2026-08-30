import { useEffect, useState } from "react";
import { enableFirebasePush, PUSH_ENABLED_KEY, syncFirebasePush } from "@/lib/firebase";

const DISMISSED_KEY = "gw-push-prompt-dismissed";

export function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      if (localStorage.getItem(PUSH_ENABLED_KEY) !== "0") {
        void syncFirebasePush().catch(() => undefined);
      }
      return;
    }
    if (Notification.permission !== "default" || localStorage.getItem(DISMISSED_KEY) === "1")
      return;
    const timer = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const close = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const activate = async () => {
    setBusy(true);
    try {
      const status = await enableFirebasePush();
      if (status === "granted") close();
    } catch {
      localStorage.removeItem(PUSH_ENABLED_KEY);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-line bg-panel p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <span
          className="material-symbols-outlined rounded-xl bg-brand/10 p-2 text-brand"
          style={{ fontSize: 22 }}
        >
          notifications_active
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Ne manquez aucun nouvel article</p>
          <p className="mt-1 text-xs leading-5 text-inkmute">
            Activez les notifications pour recevoir les actualités directement sur votre téléphone.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={activate}
              disabled={busy}
              className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {busy ? "Activation..." : "Activer"}
            </button>
            <button
              onClick={close}
              className="rounded-full border border-line px-4 py-2 text-xs font-bold text-ink"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button onClick={close} aria-label="Fermer" className="text-inkmute">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            close
          </span>
        </button>
      </div>
    </div>
  );
}
