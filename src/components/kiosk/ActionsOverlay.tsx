import { GoveeLightCard } from "@/components/actions/GoveeLightCard";

export function ActionsOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <div id="actions" className={isOpen ? "ouvert" : ""}>
      <button type="button" className="fermer" aria-label="Fermer" onClick={onClose}>
        ✕
      </button>
      <div id="actions-corps">
        <GoveeLightCard />
      </div>
      <div className="retour">✕ ou glisser vers le bas pour revenir</div>
    </div>
  );
}
