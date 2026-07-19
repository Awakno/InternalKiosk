import { CONFIG } from "@/lib/config";
import { nomCourt } from "@/lib/format";
import { fmtDateCourt } from "@/lib/time";
import type { HolidaysData } from "@/lib/holidays/types";

export function HolidaysDetail({ data, now }: { data: HolidaysData; now: Date }) {
  const cfg = CONFIG.modules.holidays;
  return (
    <>
      <h2>Vacances scolaires</h2>
      <div className="sous">
        {cfg.zone} · académie de {cfg.academie}
      </div>
      {data
        .filter((p) => p.fin >= now)
        .slice(0, 5)
        .map((p) => (
          <div key={p.nom + p.debut.toISOString()} className={`ligne${p.debut <= now ? " actuel" : ""}`}>
            <div className="principal">{nomCourt(p.nom)}</div>
            <div className="detail">
              {fmtDateCourt.format(p.debut)} → {fmtDateCourt.format(p.fin)}
            </div>
          </div>
        ))}
    </>
  );
}
