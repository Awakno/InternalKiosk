// Écran de veille : tout s'efface sauf l'heure. Le geste qui réveille est
// intercepté en amont par useVeille, il n'y a donc rien à câbler ici.
export function VeilleOverlay({ isOpen, heureTxt }: { isOpen: boolean; heureTxt: string }) {
  return (
    <div id="veille" className={isOpen ? "ouvert" : ""} aria-hidden={!isOpen}>
      {/* L'heure dérive lentement (cf. #veille-heure dans globals.css) :
          une dalle qui affiche les mêmes chiffres au même endroit toutes
          les nuits pendant des mois finit par les marquer. */}
      <div id="veille-heure">{heureTxt}</div>
    </div>
  );
}
