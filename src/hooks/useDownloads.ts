import { useCallback, useEffect, useState } from "react";

export type DownloadStatus = "idle" | "downloading" | "paused" | "error" | "done";

export type DownloadState = {
  status: DownloadStatus;
  received: number;
  total: number;
  progress: number; // 0 → 1
  error?: string;
};

type Record_ = { id: string; title: string; url: string; blob: Blob; total: number; complete: boolean };

const DB_NAME = "gw-downloads";
const STORE = "episodes";
const IDLE: DownloadState = { status: "idle", received: 0, total: 0, progress: 0 };

const states = new Map<string, DownloadState>();
const controllers = new Map<string, AbortController>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(id: string, patch: Partial<DownloadState>) {
  const base = states.get(id) ?? { ...IDLE };
  const next = { ...base, ...patch };
  next.progress = next.total > 0 ? Math.min(1, next.received / next.total) : next.progress;
  states.set(id, next);
  emit();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = run(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export async function getDownload(id: string): Promise<Record_ | undefined> {
  try {
    return await idb<Record_ | undefined>("readonly", (s) => s.get(id));
  } catch {
    return undefined;
  }
}

async function putDownload(rec: Record_) {
  try {
    await idb("readwrite", (s) => s.put(rec));
  } catch { /* quota */ }
}

export async function removeDownload(id: string) {
  try {
    await idb("readwrite", (s) => s.delete(id));
  } catch { /* ignore */ }
  states.delete(id);
  emit();
}

async function hydrate(id: string) {
  if (states.has(id)) return;
  const rec = await getDownload(id);
  if (!rec) return;
  states.set(id, {
    status: rec.complete ? "done" : "paused",
    received: rec.blob.size,
    total: rec.total || rec.blob.size,
    progress: rec.complete ? 1 : rec.total ? rec.blob.size / rec.total : 0,
  });
  emit();
}

export async function startDownload(ep: { id: string; title: string; audio: string }) {
  const current = states.get(ep.id);
  if (current?.status === "downloading" || current?.status === "done") return;

  const existing = await getDownload(ep.id);
  const already = existing && !existing.complete ? existing.blob : null;
  const offset = already?.size ?? 0;

  const controller = new AbortController();
  controllers.set(ep.id, controller);
  setState(ep.id, { status: "downloading", received: offset, total: existing?.total ?? 0, error: undefined });

  try {
    const res = await fetch(ep.audio, {
      signal: controller.signal,
      headers: offset > 0 ? { Range: `bytes=${offset}-` } : undefined,
    });

    if (!res.ok && res.status !== 206) throw new Error(`Téléchargement impossible (${res.status})`);

    const resumed = res.status === 206 && offset > 0;
    const lengthHeader = Number(res.headers.get("content-length") ?? "0");
    const total = resumed ? offset + lengthHeader : lengthHeader;
    const chunks: BlobPart[] = resumed && already ? [already] : [];
    let received = resumed ? offset : 0;
    setState(ep.id, { received, total });

    const reader = res.body?.getReader();
    if (!reader) {
      const blob = await res.blob();
      await putDownload({ id: ep.id, title: ep.title, url: ep.audio, blob, total: blob.size, complete: true });
      setState(ep.id, { status: "done", received: blob.size, total: blob.size, progress: 1 });
      return;
    }

    let lastSave = Date.now();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      setState(ep.id, { received, total });
      // Sauvegarde intermédiaire pour permettre la reprise après une coupure
      if (Date.now() - lastSave > 5000) {
        lastSave = Date.now();
        await putDownload({
          id: ep.id,
          title: ep.title,
          url: ep.audio,
          blob: new Blob(chunks, { type: res.headers.get("content-type") ?? "audio/mpeg" }),
          total,
          complete: false,
        });
      }
    }

    const blob = new Blob(chunks, { type: res.headers.get("content-type") ?? "audio/mpeg" });
    await putDownload({ id: ep.id, title: ep.title, url: ep.audio, blob, total: blob.size, complete: true });
    setState(ep.id, { status: "done", received: blob.size, total: blob.size, progress: 1 });
  } catch (err) {
    const aborted = (err as Error)?.name === "AbortError";
    setState(ep.id, {
      status: aborted ? "paused" : "error",
      error: aborted ? undefined : "Échec du téléchargement. Touchez pour reprendre.",
    });
  } finally {
    controllers.delete(ep.id);
  }
}

export function pauseDownload(id: string) {
  controllers.get(id)?.abort();
}

export function useDownload(ep: { id: string; title: string; audio: string } | null) {
  const id = ep?.id ?? "";
  const [state, setLocal] = useState<DownloadState>(states.get(id) ?? IDLE);

  useEffect(() => {
    if (!id) return;
    const sync = () => setLocal(states.get(id) ?? IDLE);
    listeners.add(sync);
    void hydrate(id).then(sync);
    sync();
    return () => { listeners.delete(sync); };
  }, [id]);

  const start = useCallback(() => { if (ep) void startDownload(ep); }, [ep]);
  const pause = useCallback(() => { if (id) pauseDownload(id); }, [id]);
  const remove = useCallback(() => { if (id) void removeDownload(id); }, [id]);

  const save = useCallback(async () => {
    if (!id) return;
    const rec = await getDownload(id);
    if (!rec?.complete) return;
    const url = URL.createObjectURL(rec.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rec.title.replace(/[^\w\s-]/g, "").slice(0, 60) || "episode"}.mp3`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [id]);

  return { ...state, start, pause, remove, save };
}
