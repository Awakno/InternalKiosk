"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CONFIG } from "@/lib/config";
import { ecrireCache, lireCache } from "@/lib/cache";

export interface PersistentData<T> {
  data: T | null;
  // Force un fetch immédiat hors cadence (changement de jour calendaire,
  // retour du réseau...). Stable, utilisable en dépendance d'effet.
  recharger: () => void;
  // Horodatage du dernier fetch réseau réussi ayant produit `data` --
  // survit au redémarrage (relu du cache), donc peut être antérieur au
  // démarrage de la page.
  savedAt: Date | null;
  // La donnée affichée n'a pas été rafraîchie depuis trop longtemps : on
  // continue de l'afficher (mieux que rien) mais l'écran doit le dire.
  isStale: boolean;
}

export interface UsePersistentDataOptions<T> {
  enabled?: boolean;
  refreshMs?: number;
  // Au-delà de cet âge, l'entrée en cache n'est plus relue du tout.
  maxAgeMs: number;
  // Au-delà de cet âge, la donnée est encore affichée mais signalée.
  staleAfterMs?: number;
  // Garde-fou métier appliqué aux seules entrées relues du cache : une
  // prévision météo de la veille passe l'âge maximal mais reste fausse
  // (son jour 0 n'est plus aujourd'hui).
  valide?: (data: T) => boolean;
}

interface State<T> {
  data: T | null;
  savedAt: Date | null;
  isStale: boolean;
}

// Socle commun aux quatre modules : hydrate depuis le cache persistant AVANT
// le premier rendu (aucun flash de l'écran de panne au démarrage), puis
// rafraîchit en tâche de fond. Un échec réseau ne remplace jamais une donnée
// déjà affichée -- il la laisse vieillir jusqu'à devenir `isStale`.
export function usePersistentData<T>(cle: string, charger: () => Promise<T>, options: UsePersistentDataOptions<T>): PersistentData<T> {
  const { enabled = true, refreshMs = CONFIG.rafraichir, maxAgeMs, staleAfterMs = CONFIG.cache.perime, valide } = options;

  const [state, setState] = useState<State<T>>(() => {
    const vide = { data: null, savedAt: null, isStale: false };
    if (!enabled) return vide;
    const hit = lireCache<T>(cle, maxAgeMs);
    if (!hit) return vide;
    if (valide && !valide(hit.data)) return vide;
    // isStale est laissé à false ici : l'effet ci-dessous le tranche à
    // partir de savedAt, y compris quand l'entrée relue est déjà périmée.
    return { data: hit.data, savedAt: hit.savedAt, isStale: false };
  });

  // Le fetcher et le garde-fou sont lus au moment de l'appel, jamais mis en
  // dépendance : ils sont stables en pratique (fonctions de module), et les
  // mettre en deps relancerait l'intervalle à chaque rendu si un appelant
  // passait une lambda.
  const latest = useRef({ charger, cle });
  useEffect(() => {
    latest.current = { charger, cle };
  });

  // `cancelled` vit hors de l'effet pour que `recharger` (appelable à tout
  // moment) partage le même verrou d'annulation que le cycle périodique.
  const cancelled = useRef(false);

  const recharger = useCallback(() => {
    if (!enabled) return;
    const { charger: fn, cle: k } = latest.current;
    fn()
      .then((data) => {
        if (cancelled.current) return;
        ecrireCache(k, data);
        setState({ data, savedAt: new Date(), isStale: false });
      })
      .catch((e) => {
        // Panne transitoire : on garde ce qui est à l'écran. `savedAt`
        // n'est pas touché, donc la donnée finit par basculer isStale
        // toute seule si les échecs se succèdent.
        console.error(k, e);
      });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    cancelled.current = false;

    recharger();
    const id = setInterval(recharger, refreshMs);
    return () => {
      cancelled.current = true;
      clearInterval(id);
    };
  }, [enabled, refreshMs, recharger]);

  // La péremption est armée par minuteur plutôt que recalculée au rendu :
  // un `Date.now()` en phase de rendu est impur (le lint React le refuse à
  // juste titre -- deux rendus donneraient deux résultats). Le minuteur
  // tombe exactement à l'échéance, sans scrutation.
  const savedAt = state.savedAt;
  useEffect(() => {
    if (!savedAt) return;
    const reste = savedAt.getTime() + staleAfterMs - Date.now();
    // Toujours passer par un minuteur, même pour une entrée déjà périmée à
    // la relecture (reste <= 0) : un setState synchrone dans le corps d'un
    // effet déclencherait un rendu en cascade.
    const id = setTimeout(() => {
      // Une donnée fraîche a pu arriver entre-temps : ne marquer périmé
      // que l'instantané qui a armé ce minuteur.
      setState((s) => (s.savedAt === savedAt ? { ...s, isStale: true } : s));
    }, Math.max(0, reste));
    return () => clearTimeout(id);
  }, [savedAt, staleAfterMs]);

  return { data: state.data, savedAt, isStale: state.isStale, recharger };
}
