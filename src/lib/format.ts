export function formatDate(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function relativeDate(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `il y a ${Math.max(1, Math.round(diff / 60))} min`;
  if (diff < 86400) return `il y a ${Math.round(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.round(diff / 86400)} j`;
  return formatDate(input);
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function prettyDuration(value: string): string {
  const parts = value.split(":").map(Number);
  if (parts.length === 3) {
    const [h, m] = parts;
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
  }
  if (parts.length === 2) return `${parts[0]} min`;
  return value;
}

export async function shareContent(data: { title: string; text?: string; url?: string }) {
  const url = data.url ?? (typeof window !== "undefined" ? window.location.href : "");
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.share) {
    try {
      await nav.share({ title: data.title, text: data.text, url });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  if (nav?.clipboard) {
    await nav.clipboard.writeText(url);
    return "copied";
  }
  return "unsupported";
}
