"use client";

import { useGoveeLight } from "@/hooks/useGoveeLight";
import { LightBulbIcon } from "@/components/icons/ActionIcons";

export function GoveeLightCard() {
  const light = useGoveeLight();
  if (!light.available) return null;

  const on = light.on === true;
  return (
    <button type="button" className={`bouton-action${on ? " actif" : ""}`} disabled={light.on === null} onClick={light.toggle}>
      <LightBulbIcon on={on} />
      <span className="bouton-action-label">{light.name ?? "Lumière"}</span>
      <span className="bouton-action-etat">{on ? "Allumée" : "Éteinte"}</span>
    </button>
  );
}
