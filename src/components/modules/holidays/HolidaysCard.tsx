import { joursEntre, nomCourt } from "@/lib/format";
import { fmtDateCourt } from "@/lib/time";
import type { HolidaysData } from "@/lib/holidays/types";

export function HolidaysCard({ data, now }: { data: HolidaysData; now: Date }) {
  const actuelle = data.find((p) => p.debut <= now && now <= p.fin);
  const prochaine = data.find((p) => p.debut > now);

  if (actuelle) {
    return (
      <>
        <span className="label">{nomCourt(actuelle.nom)}</span>
        <span className="valeur">Reprise {fmtDateCourt.format(actuelle.fin)}</span>
      </>
    );
  }
  if (prochaine) {
    return (
      <>
        <span className="label">{nomCourt(prochaine.nom)}</span>
        <span className="valeur">Dans {joursEntre(now, prochaine.debut)} j</span>
      </>
    );
  }
  return null;
}
