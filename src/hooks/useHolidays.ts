"use client";

import { CONFIG } from "@/lib/config";
import { fetchHolidays } from "@/lib/holidays/fetchHolidays";
import { joursEntre } from "@/lib/format";
import { usePersistentData } from "./usePersistentData";
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
  const { data, savedAt, isStale } = usePersistentData<HolidaysData>("holidays", fetchHolidays, {
    enabled: CONFIG.modules.holidays.enabled,
    maxAgeMs: CONFIG.cache.holidays,
  });

  return {
    data,
    isReady: data !== null,
    isRelevant: data !== null && computeHolidaysRelevant(data, now),
    savedAt,
    isStale,
  };
}
