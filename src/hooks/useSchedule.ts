import { useEffect, useState } from "react";
import { currentShow, nextShows, type Show } from "@/lib/programs";

/**
 * Programme en cours calculé côté client uniquement :
 * évite les erreurs d'hydratation (l'heure serveur ≠ heure locale).
 */
export function useSchedule() {
  const [show, setShow] = useState<Show | null>(null);
  const [next, setNext] = useState<Show[]>([]);

  useEffect(() => {
    const sync = () => {
      setShow(currentShow());
      setNext(nextShows());
    };
    sync();
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return { show, next };
}
