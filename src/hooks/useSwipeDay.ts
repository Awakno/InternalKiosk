"use client";

import { useEffect, useRef, useState } from "react";

export interface DragOverride {
  transform: string;
  opacity: number;
}

export interface UseSwipeDayOptions {
  currentDay: number;
  dayCount: number;
  onChangeDay: (n: number) => void;
  // Reset du minuteur de retour à aujourd'hui -- appelé à chaque interaction,
  // comme reveil() dans l'ancien app.js.
  onInteract: () => void;
  // Bloque le changement de jour pendant qu'un overlay est ouvert (fenêtre
  // détail, grande horloge). onDismissSwipe reçoit le geste pour laisser
  // l'appelant décider du comportement (fermer la fenêtre si assez ample,
  // ignorer pour la grande horloge) -- comportements distincts dans
  // l'ancien code, donc pas généralisables ici.
  disabled: boolean;
  onDismissSwipe?: (dx: number, dy: number) => void;
}

// Portage du geste swipe (pointerdown/move/up + résistance aux bords) de
// l'ancien app.js. Le "drag preview" en direct (avant tout commit de jour)
// est renvoyé comme état pour que le composant qui affiche #pages puisse
// l'appliquer par-dessus sa propre transition "posée" (après changement de
// jour) -- les deux ne sont jamais actifs en même temps.
export function useSwipeDay({ currentDay, dayCount, onChangeDay, onInteract, disabled, onDismissSwipe }: UseSwipeDayOptions): DragOverride | null {
  const [dragOverride, setDragOverride] = useState<DragOverride | null>(null);
  const state = useRef({ x0: null as number | null, y0: 0, dx: 0, dy: 0, geste: null as "h" | "v" | null });
  // Refs pour lire les valeurs à jour dans les listeners sans les recréer
  // à chaque changement (les listeners sont posés une seule fois). Mutées
  // dans un effet, jamais pendant le rendu.
  const latest = useRef({ currentDay, dayCount, onChangeDay, onInteract, disabled, onDismissSwipe });
  useEffect(() => {
    latest.current = { currentDay, dayCount, onChangeDay, onInteract, disabled, onDismissSwipe };
  });

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // Zones qui pilotent elles-mêmes la navigation : un appui dessus ne
      // doit pas être compté comme le début d'un balayage, sinon un doigt
      // qui ripe sur une pastille change de jour EN PLUS de la sélection.
      if (target.closest("#modules") || target.closest("#horloge") || target.closest("#jours")) {
        state.current.x0 = null;
        return;
      }
      state.current = { x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, geste: null };
      setDragOverride(null);
      latest.current.onInteract();
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = state.current;
      if (s.x0 === null) return;
      s.dx = e.clientX - s.x0;
      s.dy = e.clientY - s.y0;
      if (latest.current.disabled) return;

      if (s.geste === null && Math.abs(s.dx) + Math.abs(s.dy) > 10) {
        s.geste = Math.abs(s.dx) > Math.abs(s.dy) ? "h" : "v";
      }
      if (s.geste !== "h") return;

      const { currentDay: cd, dayCount: dc } = latest.current;
      const mur = (s.dx > 0 && cd === 0) || (s.dx < 0 && cd === dc - 1);
      const d = s.dx * (mur ? 0.12 : 0.38);
      setDragOverride({ transform: `translateX(${d}px)`, opacity: Math.max(0.35, 1 - Math.abs(d) / 260) });
    };

    const onPointerUp = () => {
      const s = state.current;
      if (s.x0 === null) return;
      if (latest.current.disabled) {
        latest.current.onDismissSwipe?.(s.dx, s.dy);
        setDragOverride(null);
        s.x0 = null;
        s.geste = null;
        return;
      }
      if (s.geste === "h" && Math.abs(s.dx) > 60) {
        const { currentDay: cd, onChangeDay } = latest.current;
        onChangeDay(cd + (s.dx < 0 ? 1 : -1));
      }
      setDragOverride(null);
      s.x0 = null;
      s.geste = null;
    };

    const onPointerCancel = () => {
      setDragOverride(null);
      state.current.x0 = null;
      state.current.geste = null;
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
    };
  }, []);

  return dragOverride;
}
