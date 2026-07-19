"use client";

import { useEffect, useState } from "react";

export interface UseCarouselRotationOptions {
  intervalMs?: number;
  paused?: boolean;
}

// Portage de la rotation automatique du carrousel de widgets (setInterval
// + indexModule dans l'ancien app.js).
export function useCarouselRotation(count: number, { intervalMs = 7000, paused = false }: UseCarouselRotationOptions = {}): number {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (count < 2 || paused) return;
    // Le modulo gère naturellement le cas où activeIndex est temporairement
    // hors bornes après un rétrécissement de la liste qualifiée -- pas besoin
    // d'un second effet pour reclamper l'état (voir la valeur de retour).
    const id = setInterval(() => setActiveIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs, paused]);

  // Équivalent de "if (indexModule >= qual.length) indexModule = 0;" --
  // calculé au rendu plutôt que via un setState synchrone dans un effet.
  return count > 0 && activeIndex >= count ? 0 : activeIndex;
}
