"use client";

import { useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";
import { fetchFuel } from "@/lib/fuel/fetchFuel";
import type { FuelData } from "@/lib/fuel/types";
import type { ModuleResult } from "@/lib/types";

export function useFuel(): ModuleResult<FuelData> {
  const [state, setState] = useState<ModuleResult<FuelData>>({
    data: null,
    isReady: false,
    isRelevant: CONFIG.modules.fuel.enabled,
  });

  useEffect(() => {
    if (!CONFIG.modules.fuel.enabled) return;
    let cancelled = false;

    const load = () => {
      fetchFuel()
        .then((data) => {
          if (cancelled) return;
          setState({ data, isReady: true, isRelevant: data.length > 0 });
        })
        .catch((e) => {
          console.error("fuel", e);
          // Une panne transitoire ne doit pas effacer une donnée déjà
          // affichée -- l'ancien module ne touchait pas this.data au catch.
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
