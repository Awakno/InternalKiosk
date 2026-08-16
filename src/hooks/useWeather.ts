"use client";

import { useCallback, useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";
import { fetchWeather } from "@/lib/weather/fetchWeather";
import { maintenant } from "@/lib/time";
import { usePersistentData } from "./usePersistentData";
import type { WeatherDay } from "@/lib/weather/types";

export interface UseWeatherResult {
  data: WeatherDay[] | null;
  isReady: boolean;
  currentDay: number;
  goToDay: (n: number) => void;
  savedAt: Date | null;
  isStale: boolean;
}

// Une prévision relue du cache n'est exploitable que si son jour 0 est
// toujours aujourd'hui : passé minuit, tout l'écran (« mardi 15 », les
// courbes horaires, le lever/coucher qui pilote la couleur d'ambiance)
// décrirait la veille sans qu'aucune valeur n'ait l'air fausse. L'âge
// maximal ne suffit pas à l'exprimer -- 3 h d'ancienneté à 1 h du matin,
// c'est déjà le mauvais jour.
function memeJour(data: WeatherDay[]): boolean {
  const jour0 = data[0]?.date;
  if (!jour0) return false;
  return jour0.toDateString() === maintenant().toDateString();
}

export function useWeather(): UseWeatherResult {
  const { data, savedAt, isStale, recharger } = usePersistentData<WeatherDay[]>("weather", fetchWeather, {
    enabled: CONFIG.modules.weather,
    maxAgeMs: CONFIG.cache.weather,
    valide: memeJour,
  });

  const [currentDay, setCurrentDay] = useState(0);

  // À minuit, le jour 0 de la prévision en mémoire devient la veille : sans
  // ça, l'écran affiche la mauvaise date jusqu'au rafraîchissement suivant
  // (jusqu'à dix minutes). On recharge donc au passage de minuit plutôt que
  // d'attendre la cadence. Horloge réelle volontairement, pas maintenant() :
  // le débogage ?heure= fige l'affichage, pas le calendrier de l'API.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const armer = () => {
      const minuit = new Date();
      minuit.setHours(24, 0, 3, 0);
      timer = setTimeout(() => {
        recharger();
        armer();
      }, minuit.getTime() - Date.now());
    };

    armer();
    return () => clearTimeout(timer);
  }, [recharger]);

  // Reclampé au rendu plutôt que via un setState après chargement : si la
  // liste de jours rétrécit, l'index redevient valide immédiatement.
  const jourAffiche = data ? Math.min(currentDay, data.length - 1) : currentDay;

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

  return { data, isReady: data !== null, currentDay: jourAffiche, goToDay, savedAt, isStale };
}
