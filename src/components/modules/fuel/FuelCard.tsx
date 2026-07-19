import { CONFIG } from "@/lib/config";
import { fmtPrix } from "@/lib/format";
import type { FuelData } from "@/lib/fuel/types";

export function FuelCard({ data }: { data: FuelData }) {
  return (
    <>
      <span className="label">Carburant · {CONFIG.modules.fuel.type}</span>
      <span className="valeur">{fmtPrix(data[0].prix)}</span>
    </>
  );
}
