"use client";

import { useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";
import { fetchHolidays } from "@/lib/holidays/fetchHolidays";
import { joursEntre } from "@/lib/format";
import type { HolidaysData } from "@/lib/holidays/types";
import type { ModuleResult } from "@/lib/types";

// isRelevant dépend de l'heure courante, pas seulement de la donnée
// chargée (une période de vacances devient/cesse d'être pertinente au fil
// du temps sans nouveau fetch) -- `now` doit donc venir d'un tick partagé
// (useClockTick côté KioskApp), pas être figé au moment du chargement.
export function computeHolidaysRelevant(data: HolidaysData, now: Date): boolean {
  if (!data.length) return false;
  if (data.some((p) => p.debut <= now && now <= p.fin)) return true;
  const prochaine = data.find((p) => p.debut > now);
  return !!prochaine && joursEntre(now, prochaine.debut) <= 21;
}

export function useHolidays(now: Date): ModuleResult<HolidaysData> {
  const [data, setData] = useState<HolidaysData | null>(null);

  useEffect(() => {
    if (!CONFIG.modules.holidays.enabled) return;
    let cancelled = false;

    const load = () => {
      fetchHolidays()
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch((e) => console.error("holidays", e));
    };

    load();
    const id = setInterval(load, CONFIG.rafraichir);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!CONFIG.modules.holidays.enabled || !data) {
    return { data: null, isReady: false, isRelevant: false };
  }

  return { data, isReady: true, isRelevant: computeHolidaysRelevant(data, now) };
}
