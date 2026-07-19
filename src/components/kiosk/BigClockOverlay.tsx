export function BigClockOverlay({ isOpen, heureTxt, onClose }: { isOpen: boolean; heureTxt: string; onClose: () => void }) {
  return (
    <div id="horloge-grand" className={isOpen ? "ouvert" : ""} onClick={onClose}>
      <div id="horloge-grand-heure">{heureTxt}</div>
    </div>
  );
}
