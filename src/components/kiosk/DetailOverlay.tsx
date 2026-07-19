import type { WidgetEntry } from "@/hooks/useModules";

export function DetailOverlay({ widgets, activeModuleId, isOpen, onClose }: { widgets: WidgetEntry[]; activeModuleId: string | null; isOpen: boolean; onClose: () => void }) {
  const widget = widgets.find((w) => w.id === activeModuleId);

  return (
    <div id="fenetre" className={isOpen ? "ouverte" : ""}>
      <button type="button" className="fermer" aria-label="Fermer" onClick={onClose}>
        ✕
      </button>
      <div id="fenetre-corps">
        {widget?.renderDetail()}
        {widget && <div className="retour">✕ ou glisser pour revenir</div>}
      </div>
    </div>
  );
}
