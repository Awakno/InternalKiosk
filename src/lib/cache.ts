// Cache persistant (localStorage)
//
// À ne pas confondre avec le Map de fetch.ts : celui-là ne vit que le
// temps d'un onglet et disparaît au moindre rechargement. Or le kiosque
// tourne 24/7 derrière une connexion domestique et redémarre pour un rien
// (coupure de courant, relance de Chromium par le script de supervision).
// Sans persistance, un redémarrage pendant une panne réseau affiche
// « Pas de données météo » alors qu'on avait des données parfaitement
// exploitables dix minutes plus tôt. Ce cache-ci survit au rechargement.

const PREFIX = "kiosk:v1:";

// Bump ce numéro (dans PREFIX) si la forme des données stockées change :
// les anciennes entrées deviennent alors inaccessibles plutôt que d'être
// relues avec un schéma qui ne correspond plus.

interface StoredEntry<T> {
  savedAt: number;
  data: T;
}

export interface CachedEntry<T> {
  data: T;
  // Horodatage du fetch réseau d'origine, pas de la relecture : c'est lui
  // qui permet de dire à l'écran « donnée de 14:32 ».
  savedAt: Date;
}

// JSON ne connaît pas Date : les objets métier (WeatherDay.lever,
// HolidayPeriod.debut, AirQualityData.time...) reviennent en chaînes ISO.
// On les re-hydrate en revivant toute chaîne qui EST exactement une date
// ISO. Le motif est ancré des deux côtés : un nom de station-service ou
// une description de vacances contenant une date ne peut pas matcher.
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function revive(_cle: string, valeur: unknown): unknown {
  if (typeof valeur === "string" && ISO.test(valeur)) {
    const d = new Date(valeur);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return valeur;
}

// localStorage peut lever (mode privé, quota dépassé, stockage désactivé
// par politique). Sur un kiosque qui doit tenir des mois sans supervision,
// aucune de ces situations ne justifie de faire tomber l'affichage : on
// dégrade silencieusement vers « pas de cache ».
function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function lireCache<T>(cle: string, maxAgeMs: number): CachedEntry<T> | null {
  const store = storage();
  if (!store) return null;

  const brut = (() => {
    try {
      return store.getItem(PREFIX + cle);
    } catch {
      return null;
    }
  })();
  if (!brut) return null;

  try {
    const entry = JSON.parse(brut, revive) as StoredEntry<T>;
    // savedAt est écrit en nombre : le reviver ne le transforme pas.
    if (typeof entry?.savedAt !== "number" || entry.data == null) throw new Error("entrée malformée");
    if (Date.now() - entry.savedAt > maxAgeMs) {
      oublierCache(cle);
      return null;
    }
    return { data: entry.data, savedAt: new Date(entry.savedAt) };
  } catch {
    // Entrée illisible (schéma d'une version précédente, écriture
    // interrompue) : on la jette plutôt que de la relire à chaque cycle.
    oublierCache(cle);
    return null;
  }
}

export function ecrireCache<T>(cle: string, data: T): void {
  const store = storage();
  if (!store) return;
  try {
    const entry: StoredEntry<T> = { savedAt: Date.now(), data };
    store.setItem(PREFIX + cle, JSON.stringify(entry));
  } catch {
    // Quota plein : tant pis pour la persistance, l'affichage en cours
    // n'en dépend pas.
  }
}

export function oublierCache(cle: string): void {
  try {
    storage()?.removeItem(PREFIX + cle);
  } catch {
    // ignoré : voir storage()
  }
}
