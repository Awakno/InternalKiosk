// Horloge + query params de debug (?heure=6.5, ?ambiance=nuit)
//
// Contrairement à la version vanilla, on NE mute plus CONFIG.ambiance au
// chargement du module : cette lib peut en théorie être importée dans un
// contexte sans `window` (même si en pratique elle n'est appelée que
// depuis l'intérieur de la frontière ssr:false). getDebugArgs() est donc
// une fonction, pas un objet figé au chargement -- lue à la demande.

import { CONFIG } from "./config";

export function getDebugArgs(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

// L'ambiance effective : le réglage CONFIG, sauf override ?ambiance= pour
// forcer un mode pendant les tests visuels.
export function getEffectiveAmbiance(): "ciel" | "nuit" {
  const override = getDebugArgs().get("ambiance");
  return override === "nuit" || override === "ciel" ? override : CONFIG.ambiance;
}

// ?heure=6.5 fige l'horloge affichée à 6h30, pour tester le rendu jour/nuit
// sans attendre la vraie heure.
export function maintenant(): Date {
  const n = new Date();
  const heure = getDebugArgs().get("heure");
  if (heure !== null) {
    const h = parseFloat(heure);
    n.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
  }
  return n;
}

// Formatters globaux
export const fmtJour = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: CONFIG.location.timezone,
});

export const fmtHM = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: CONFIG.location.timezone,
});

export const fmtDateCourt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: CONFIG.location.timezone,
});
