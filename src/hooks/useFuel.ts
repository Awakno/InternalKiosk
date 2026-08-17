"use client";

import { CONFIG } from "@/lib/config";
import { fetchFuel } from "@/lib/fuel/fetchFuel";
import { usePersistentData } from "./usePersistentData";
import type { FuelData } from "@/lib/fuel/types";
import type { ModuleResult } from "@/lib/types";

export function useFuel(): ModuleResult<FuelData> {
  const { data, savedAt, isStale } = usePersistentData<FuelData>("fuel", fetchFuel, {
    enabled: CONFIG.modules.fuel.enabled,
    maxAgeMs: CONFIG.cache.fuel,
  });

  return {
    data,
    isReady: data !== null,
    isRelevant: data !== null && data.length > 0,
    savedAt,
    isStale,
  };
}
