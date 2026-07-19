"use client";

import { useCallback, useEffect, useRef } from "react";

// Portage de reveil()/minuteurRetour : sans interaction, on revient à
// aujourd'hui après CONFIG.retourAujourd. Se réarme automatiquement à
// chaque changement de currentDay (couvre le cas où goToDay() l'appelait
// en interne), et expose `reveil` pour les interactions qui ne changent
// pas forcément de jour (un simple tap, comme pointerdown dans l'ancien
// code).
export function useReturnToToday(currentDay: number, goToDay: (n: number) => void, delayMs: number): () => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goToDayRef = useRef(goToDay);

  // Les refs ne doivent pas être mutées pendant le rendu -- on les
  // synchronise dans un effet, lu plus tard uniquement depuis le callback.
  useEffect(() => {
    goToDayRef.current = goToDay;
  });

  const reveil = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (currentDay !== 0) {
      timerRef.current = setTimeout(() => goToDayRef.current(0), delayMs);
    }
  }, [currentDay, delayMs]);

  useEffect(() => {
    reveil();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reveil]);

  return reveil;
}
