"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseVeilleOptions {
  enabled: boolean;
  delaiMs: number;
  // Conditions extérieures autorisant la mise en veille (plage nocturne).
  // Repasser à false réveille immédiatement.
  autorise: boolean;
}

// Combien de temps on avale les événements après un réveil. Un
// stopPropagation sur le seul pointerdown ne suffit pas : le click de
// compatibilité qui suit est un événement distinct, et c'est lui qui
// ouvrirait la grande horloge si le doigt tombe sur #horloge.
const AVALER_MS = 500;

// Mise en veille sur inactivité.
//
// Le geste qui réveille ne doit RIEN déclencher d'autre : toucher l'écran
// endormi pour le rallumer ne doit pas changer de jour ni ouvrir un
// overlay. Les écouteurs sont donc posés en phase de capture sur document,
// en amont de ceux de useSwipeDay et de KioskApp (posés en bulle) : un
// stopPropagation à ce niveau empêche l'événement d'atteindre la cible,
// donc de remonter jusqu'à eux.
export function useVeille({ enabled, delaiMs, autorise }: UseVeilleOptions): boolean {
  const [endormi, setEndormi] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enVeille = useRef(false);
  const avalerJusqua = useRef(0);
  const actif = enabled && autorise;

  // Dérivé plutôt que stocké : sortir de la plage nocturne rallume l'écran
  // au rendu même, sans attendre qu'un effet remette l'état à plat (ce qui
  // laisserait passer une image d'écran endormi en plein jour).
  const isVeille = endormi && actif;

  // L'état est aussi tenu en ref : les écouteurs sont posés une seule fois
  // et doivent lire la valeur à jour sans être recréés (même parti pris
  // que le `latest` de useSwipeDay).
  useEffect(() => {
    enVeille.current = isVeille;
  }, [isVeille]);

  const armer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!actif) return;
    timer.current = setTimeout(() => setEndormi(true), delaiMs);
  }, [actif, delaiMs]);

  useEffect(() => {
    armer();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      // Remise à plat au changement de plage : sans ça, `endormi` resterait
      // vrai depuis la nuit précédente et l'écran se rendormirait à la
      // seconde où la plage nocturne redevient active.
      setEndormi(false);
    };
  }, [armer]);

  useEffect(() => {
    const reveiller = (e: Event) => {
      if (enVeille.current) {
        e.stopPropagation();
        e.preventDefault();
        avalerJusqua.current = Date.now() + AVALER_MS;
        enVeille.current = false;
        setEndormi(false);
      }
      armer();
    };

    // Les événements de fin de geste (pointerup, click) sont avalés sur une
    // courte fenêtre après le réveil, même s'ils arrivent alors que l'état
    // est déjà repassé à « éveillé ».
    const filtrer = (e: Event) => {
      if (Date.now() < avalerJusqua.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    document.addEventListener("pointerdown", reveiller, true);
    document.addEventListener("keydown", reveiller, true);
    document.addEventListener("pointerup", filtrer, true);
    document.addEventListener("click", filtrer, true);
    return () => {
      document.removeEventListener("pointerdown", reveiller, true);
      document.removeEventListener("keydown", reveiller, true);
      document.removeEventListener("pointerup", filtrer, true);
      document.removeEventListener("click", filtrer, true);
    };
  }, [armer]);

  return isVeille;
}
