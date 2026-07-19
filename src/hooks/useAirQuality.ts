"use client";

import { useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";
import { fetchAirQuality } from "@/lib/airquality/fetchAirQuality";
import { disponible } from "@/lib/format";
import type { AirQualityData } from "@/lib/airquality/types";
import type { ModuleResult } from "@/lib/types";

export function useAirQuality(): ModuleResult<AirQualityData> {
  const [state, setState] = useState<ModuleResult<AirQualityData>>({
    data: null,
    isReady: false,
    isRelevant: CONFIG.modules.airQuality.enabled,
  });

  useEffect(() => {
    if (!CONFIG.modules.airQuality.enabled) return;
    let cancelled = false;

    const load = () => {
      fetchAirQuality()
        .then((data) => {
          if (cancelled) return;
          setState({ data, isReady: true, isRelevant: disponible(data.aqi) });
        })
        .catch((e) => {
          console.error("airQuality", e);
          // Panne transitoire : ne pas effacer une donnée déjà affichée.
          if (!cancelled) setState((s) => (s.data ? s : { data: null, isReady: true, isRelevant: false }));
        });
    };

    load();
    const id = setInterval(load, CONFIG.rafraichir);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}
