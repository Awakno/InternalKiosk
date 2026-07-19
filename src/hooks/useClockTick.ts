"use client";

import { useEffect, useState } from "react";
import { maintenant } from "@/lib/time";

// Une seule instance partagée au niveau KioskApp -- évite que plusieurs
// timers indépendants (horloge, ambiance météo, carrousel) dérivent l'un
// par rapport à l'autre. Respecte ?heure= via maintenant().
export function useClockTick(intervalMs: number): Date {
  const [now, setNow] = useState<Date>(() => maintenant());

  useEffect(() => {
    const id = setInterval(() => setNow(maintenant()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
