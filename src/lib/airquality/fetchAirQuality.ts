import { CONFIG } from "@/lib/config";
import { fetchJSON } from "@/lib/fetch";
import type { AirQualityData } from "./types";

interface AirQualityResponseRaw {
  current: {
    european_aqi: number | null;
    time: string;
  };
}

export async function fetchAirQuality(): Promise<AirQualityData> {
  const url =
    "https://air-quality-api.open-meteo.com/v1/air-quality?" +
    new URLSearchParams({
      latitude: String(CONFIG.location.latitude),
      longitude: String(CONFIG.location.longitude),
      current: "european_aqi",
    });

  const j = await fetchJSON<AirQualityResponseRaw>(url);
  return { aqi: j.current.european_aqi, time: new Date(j.current.time) };
}
