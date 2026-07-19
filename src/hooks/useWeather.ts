"use client";

import { useCallback, useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";
import { fetchWeather } from "@/lib/weather/fetchWeather";
import type { WeatherDay } from "@/lib/weather/types";

export interface UseWeatherResult {
  data: WeatherDay[] | null;
  isReady: boolean;
  currentDay: number;
  goToDay: (n: number) => void;
}

export function useWeather(): UseWeatherResult {
  const [data, setData] = useState<WeatherDay[] | null>(null);
  const [currentDay, setCurrentDay] = useState(0);

  useEffect(() => {
    if (!CONFIG.modules.weather) return;
    let cancelled = false;

    const load = () => {
      fetchWeather()
        .then((jours) => {
          if (cancelled) return;
          setData(jours);
          setCurrentDay((d) => Math.min(d, jours.length - 1));
        })
        .catch((e) => console.error("weather", e));
    };

    load();
    const id = setInterval(load, CONFIG.rafraichir);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Même borne que l'ancien goToDay() : [0, data.length - 1].
  const goToDay = useCallback(
    (n: number) => {
      setCurrentDay((prev) => {
        if (!data) return prev;
        return Math.max(0, Math.min(data.length - 1, n));
      });
    },
    [data],
  );

  return { data, isReady: data !== null, currentDay, goToDay };
}
