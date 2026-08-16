"use client";

import { CONFIG } from "@/lib/config";
import { fetchAirQuality } from "@/lib/airquality/fetchAirQuality";
import { disponible } from "@/lib/format";
import { usePersistentData } from "./usePersistentData";
import type { AirQualityData } from "@/lib/airquality/types";
import type { ModuleResult } from "@/lib/types";

export function useAirQuality(): ModuleResult<AirQualityData> {
  const { data, savedAt, isStale } = usePersistentData<AirQualityData>("airQuality", fetchAirQuality, {
    enabled: CONFIG.modules.airQuality.enabled,
    maxAgeMs: CONFIG.cache.airQuality,
  });

  return {
    data,
    isReady: data !== null,
    isRelevant: data !== null && disponible(data.aqi),
    savedAt,
    isStale,
  };
}
