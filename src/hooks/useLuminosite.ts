"use client";

import { useEffect, useRef } from "react";

// Applique le facteur de luminosité au voile #tamis, via une variable CSS.
//
// La durée du fondu dépend du sens : s'assombrir se fait lentement (on ne
// veut pas d'un à-coup visible au coucher, ni au passage en veille), se
// rallumer doit être immédiat -- quand on pose le doigt sur l'écran en
// pleine nuit, attendre trois secondes que l'image revienne donnerait
// l'impression d'un kiosque planté.
const FONDU_ASSOMBRIR = "3s";
const FONDU_ECLAIRCIR = ".28s";

export function useLuminosite(facteur: number): void {
  const precedent = useRef<number | null>(null);

  useEffect(() => {
    const racine = document.documentElement;
    const avant = precedent.current;
    racine.style.setProperty("--tamis-duree", avant !== null && facteur > avant ? FONDU_ECLAIRCIR : FONDU_ASSOMBRIR);
    racine.style.setProperty("--luminosite", String(facteur));
    precedent.current = facteur;
  }, [facteur]);
}
