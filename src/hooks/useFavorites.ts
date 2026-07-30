import { useCallback, useEffect, useState } from "react";

export type FavKind = "podcast" | "article";
export type Favorite = {
  id: string;
  kind: FavKind;
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
  audio?: string;
};

const KEY = "gw-favorites";

function read(): Favorite[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as Favorite[];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [items, setItems] = useState<Favorite[]>([]);

  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener("gw-favorites", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("gw-favorites", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persist = useCallback((next: Favorite[]) => {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event("gw-favorites"));
  }, []);

  const toggle = useCallback((fav: Favorite) => {
    const current = read();
    const exists = current.some((f) => f.id === fav.id);
    persist(exists ? current.filter((f) => f.id !== fav.id) : [fav, ...current]);
    return !exists;
  }, [persist]);

  const isFavorite = useCallback((id: string) => items.some((f) => f.id === id), [items]);

  return { items, toggle, isFavorite };
}
