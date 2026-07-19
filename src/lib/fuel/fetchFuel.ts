import { CONFIG } from "@/lib/config";
import { fetchJSON } from "@/lib/fetch";
import { distanceKm } from "@/lib/color";
import type { FuelData } from "./types";

interface FuelRecordRaw {
  fields: Record<string, unknown> & {
    adresse?: string;
    ville?: string;
    geom?: [number, number];
  };
}

interface FuelResponseRaw {
  records: FuelRecordRaw[];
}

export async function fetchFuel(): Promise<FuelData> {
  const cfg = CONFIG.modules.fuel;
  const p = new URLSearchParams({
    dataset: "prix-des-carburants-en-france-flux-instantane-v2",
    "geofilter.distance": `${CONFIG.location.latitude},${CONFIG.location.longitude},${cfg.rayon}`,
    rows: "25",
  });
  const j = await fetchJSON<FuelResponseRaw>("https://data.economie.gouv.fr/api/records/1.0/search/?" + p);
  const type = cfg.type;

  return j.records
    .map((rec) => rec.fields)
    .filter((f): f is typeof f & { adresse: string; ville: string } => f[`${type}_prix`] != null)
    .map((f) => ({
      adresse: f.adresse,
      ville: f.ville,
      prix: f[`${type}_prix`] as number,
      distance: f.geom ? distanceKm(CONFIG.location.latitude, CONFIG.location.longitude, f.geom[0], f.geom[1]) : null,
    }))
    .sort((a, b) => a.prix - b.prix);
}
