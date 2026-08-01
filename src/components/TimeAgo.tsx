import { useEffect, useState } from "react";
import { formatDate, relativeDate } from "@/lib/format";

/**
 * Date relative rendue uniquement après hydratation :
 * la valeur serveur diffère sinon de la valeur client.
 */
export function TimeAgo({ date }: { date: string }) {
  const [label, setLabel] = useState(() => formatDate(date));

  useEffect(() => {
    setLabel(relativeDate(date));
  }, [date]);

  return <span suppressHydrationWarning>{label}</span>;
}
