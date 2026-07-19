import { CONFIG } from "@/lib/config";
import { fmtPrix } from "@/lib/format";
import type { FuelData } from "@/lib/fuel/types";

export function FuelDetail({ data }: { data: FuelData }) {
  return (
    <>
      <h2>Carburants</h2>
      <div className="sous">
        {CONFIG.modules.fuel.type} · {CONFIG.location.name}
      </div>
      {data.slice(0, 6).map((s, i) => (
        <div key={`${s.adresse}-${s.ville}`} className={`ligne${i === 0 ? " actuel" : ""}`}>
          <div className="principal">
            {s.adresse}, {s.ville}
          </div>
          <div className="detail">
            {fmtPrix(s.prix)}
            {s.distance != null ? ` · ${s.distance.toFixed(1)} km` : ""}
          </div>
        </div>
      ))}
    </>
  );
}
