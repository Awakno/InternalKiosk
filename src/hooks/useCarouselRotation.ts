"use client";

import { useCallback, useEffect, useState } from "react";

export interface UseCarouselRotationOptions {
  intervalMs?: number;
  paused?: boolean;
  // Répit accordé après une sélection au doigt avant que la rotation
  // automatique ne reprenne la main.
  pauseApresTouche?: number;
}

export interface CarouselControls {
  activeIndex: number;
  selectionner: (i: number) => void;
}

// Portage de la rotation automatique du carrousel de widgets (setInterval
// + indexModule dans l'ancien app.js), plus la sélection au doigt : sur un
// écran tactile, attendre que le widget voulu revienne de lui-même n'est
// pas une interaction acceptable.
export function useCarouselRotation(count: number, { intervalMs = 7000, paused = false, pauseApresTouche = 25_000 }: UseCarouselRotationOptions = {}): CarouselControls {
  const [activeIndex, setActiveIndex] = useState(0);
  // Compteur de sélections manuelles : sert uniquement à relancer l'effet
  // ci-dessous, pour que chaque nouvelle touche réarme le répit en entier
  // (un booléen d'état resterait à `true` et ne relancerait rien).
  const [touches, setTouches] = useState(0);

  const selectionner = useCallback((i: number) => {
    setActiveIndex(i);
    setTouches((n) => n + 1);
  }, []);

  useEffect(() => {
    if (count < 2 || paused) return;

    // Le modulo gère naturellement le cas où activeIndex est temporairement
    // hors bornes après un rétrécissement de la liste qualifiée -- pas besoin
    // d'un second effet pour reclamper l'état (voir la valeur de retour).
    const suivant = () => setActiveIndex((i) => (i + 1) % count);

    // Premier délai allongé après une sélection manuelle : on vient de
    // choisir ce widget, le faire glisser 7 s plus tard reviendrait à
    // annuler le geste.
    let rotation: ReturnType<typeof setInterval>;
    const amorce = setTimeout(
      () => {
        suivant();
        rotation = setInterval(suivant, intervalMs);
      },
      touches === 0 ? intervalMs : pauseApresTouche,
    );

    return () => {
      clearTimeout(amorce);
      clearInterval(rotation);
    };
  }, [count, intervalMs, paused, touches, pauseApresTouche]);

  // Équivalent de "if (indexModule >= qual.length) indexModule = 0;" --
  // calculé au rendu plutôt que via un setState synchrone dans un effet.
  return { activeIndex: count > 0 && activeIndex >= count ? 0 : activeIndex, selectionner };
}
