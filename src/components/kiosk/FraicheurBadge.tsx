import { fmtHM } from "@/lib/time";

// Afficher une donnée d'archive sans le dire serait pire que ne rien
// afficher : le kiosque n'a aucune autre façon de signaler qu'il a perdu
// le réseau (pas de barre d'état, pas de rechargement manuel possible).
export function FraicheurBadge({ savedAt, isStale }: { savedAt: Date | null; isStale: boolean }) {
  if (!isStale || !savedAt) return null;
  return <div id="fraicheur">Hors ligne · {fmtHM.format(savedAt)}</div>;
}
