// Luminosité selon l'heure
//
// Une page web ne peut pas toucher au rétroéclairage de la dalle : tout ce
// qu'on calcule ici est un facteur 0..1 appliqué comme un voile noir
// par-dessus l'image (#tamis dans globals.css). L'effet est réel et suffit
// pour un écran allumé dans une pièce de vie la nuit, mais ce n'est pas la
// même chose qu'éteindre le rétroéclairage -- pour ça, voir le README.

import type { LuminositeConfig } from "./config";

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

// Heure décimale locale : 22 h 30 -> 22.5. L'horloge du Pi est réglée sur
// le fuseau du kiosque, et ?heure= agit lui aussi sur l'heure locale --
// même référentiel des deux côtés.
export function heureDecimale(now: Date): number {
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

// Écart circulaire h - ref ramené dans [-12, 12) : permet de traiter une
// nuit qui enjambe minuit (22 h -> 7 h) sans cas particulier.
function ecart(h: number, ref: number): number {
  return ((((h - ref + 12) % 24) + 24) % 24) - 12;
}

// Part de nuit à l'instant donné : 0 en plein jour, 1 en pleine nuit,
// valeurs intermédiaires pendant les fondus centrés sur debutNuit et
// finNuit. Chaque bascule est décrite par sa propre rampe, et on retient
// la plus contraignante -- une heure n'est nocturne que si elle est à la
// fois après le coucher et avant le lever.
export function partDeNuit(now: Date, cfg: LuminositeConfig): number {
  const t = Math.max(cfg.transition, 1) / 60;
  const h = heureDecimale(now);

  const entree = clamp01((ecart(h, cfg.debutNuit) + t / 2) / t);
  const sortie = 1 - clamp01((ecart(h, cfg.finNuit) + t / 2) / t);

  return Math.min(entree, sortie);
}

export function estNuit(now: Date, cfg: LuminositeConfig): boolean {
  return partDeNuit(now, cfg) > 0.5;
}

export function computeLuminosite(now: Date, cfg: LuminositeConfig): number {
  if (!cfg.enabled) return 1;
  const n = partDeNuit(now, cfg);
  return clamp01(cfg.jour + (cfg.nuit - cfg.jour) * n);
}
