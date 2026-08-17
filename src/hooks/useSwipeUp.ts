"use client";

import { useEffect, useRef } from "react";

export interface UseSwipeUpOptions {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  // Comme dans useSwipeDay : n'ouvre pas par-dessus un autre overlay déjà
  // affiché (fenêtre détail, grande horloge).
  disabled: boolean;
}

const SEUIL = 70;

// Balayage vertical, indépendant du balayage horizontal de useSwipeDay (qui
// détecte lui aussi un geste "v" mais ne l'exploite pas) : ici un tir vers
// le haut ouvre le tableau d'actions, vers le bas le referme. Pas
// d'aperçu en direct façon useSwipeDay -- l'overlay est une page plein
// écran avec sa propre transition CSS posée à l'ouverture/fermeture.
export function useSwipeUp({ isOpen, onOpen, onClose, disabled }: UseSwipeUpOptions) {
  const state = useRef({ x0: null as number | null, y0: 0 });
  const latest = useRef({ isOpen, onOpen, onClose, disabled });
  useEffect(() => {
    latest.current = { isOpen, onOpen, onClose, disabled };
  });

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("#modules") || target.closest("#horloge") || target.closest("#jours") || target.closest("#actions")) {
        state.current.x0 = null;
        return;
      }
      state.current = { x0: e.clientX, y0: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const s = state.current;
      if (s.x0 === null) return;
      const dx = e.clientX - s.x0;
      const dy = e.clientY - s.y0;
      s.x0 = null;
      if (Math.abs(dy) < SEUIL || Math.abs(dy) < Math.abs(dx)) return;

      const { isOpen: open, onOpen: doOpen, onClose: doClose, disabled: off } = latest.current;
      if (dy < 0 && !open && !off) doOpen();
      if (dy > 0 && open) doClose();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, []);
}
