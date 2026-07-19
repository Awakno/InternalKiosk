import { CONFIG } from "@/lib/config";
import { fetchJSON } from "@/lib/fetch";
import type { HolidaysData } from "./types";

interface HolidayRecordRaw {
  fields: {
    start_date?: string;
    end_date?: string;
    description?: string;
  };
}

interface HolidaysResponseRaw {
  records: HolidayRecordRaw[];
}

export async function fetchHolidays(): Promise<HolidaysData> {
  const cfg = CONFIG.modules.holidays;
  const p = new URLSearchParams({
    dataset: "fr-en-calendrier-scolaire",
    q: `location:"${cfg.academie}" AND zones:"${cfg.zone}"`,
    sort: "start_date",
    rows: "40",
  });
  const j = await fetchJSON<HolidaysResponseRaw>("https://data.education.gouv.fr/api/records/1.0/search/?" + p);

  const vu = new Set<string>();
  return j.records
    .map((rec) => rec.fields)
    .filter((f): f is { start_date: string; end_date: string; description: string } => !!(f.start_date && f.end_date && /^(Vacances|Début des Vacances)/i.test(f.description || "")))
    .map((f) => ({ nom: f.description, debut: new Date(f.start_date), fin: new Date(f.end_date) }))
    .filter((x) => {
      const cle = x.nom + x.debut.toISOString().slice(0, 10);
      return vu.has(cle) ? false : (vu.add(cle), true);
    })
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());
}
