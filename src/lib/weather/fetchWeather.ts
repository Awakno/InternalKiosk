import { CONFIG } from "@/lib/config";
import { fetchJSON } from "@/lib/fetch";
import { lireISO } from "@/lib/format";
import { maintenant } from "@/lib/time";
import type { WeatherDay } from "./types";

interface OpenMeteoResponse {
  current: {
    weather_code: number;
    temperature_2m: number | null;
    apparent_temperature: number | null;
    relative_humidity_2m: number | null;
    wind_speed_10m: number | null;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: (number | null)[];
    precipitation_probability: (number | null)[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: (number | null)[];
  };
}

// Math.round(null) vaut 0 : ça masquerait une donnée manquante derrière
// une fausse valeur plausible. On préserve donc le null.
const arrondi = (v: number | null): number | null => (v != null ? Math.round(v) : null);

export async function fetchWeather(): Promise<WeatherDay[]> {
  const url =
    "https://api.open-meteo.com/v1/forecast?" +
    new URLSearchParams({
      latitude: String(CONFIG.location.latitude),
      longitude: String(CONFIG.location.longitude),
      timezone: CONFIG.location.timezone,
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
      hourly: "temperature_2m,precipitation_probability",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max",
      forecast_days: String(CONFIG.nbJours),
    });

  const j = await fetchJSON<OpenMeteoResponse>(url);

  const heuresDe = (cle: string) =>
    j.hourly.time
      .map((t, i) => ({ t, i }))
      .filter((o) => o.t.startsWith(cle))
      .map((o) => ({
        date: lireISO(o.t),
        temp: j.hourly.temperature_2m[o.i],
        pluie: j.hourly.precipitation_probability[o.i] ?? 0,
      }))
      .filter((p): p is { date: Date; temp: number; pluie: number } => p.temp !== null);

  const jours: WeatherDay[] = j.daily.time.map((cle, n) => ({
    date: lireISO(cle + "T12:00"),
    code: j.daily.weather_code[n],
    max: arrondi(j.daily.temperature_2m_max[n]),
    min: arrondi(j.daily.temperature_2m_min[n]),
    pluie: j.daily.precipitation_probability_max[n] ?? null,
    vent: arrondi(j.daily.wind_speed_10m_max[n]),
    lever: lireISO(j.daily.sunrise[n]),
    coucher: lireISO(j.daily.sunset[n]),
    pts: heuresDe(cle),
  }));

  const depart = maintenant().getTime() - 3600e3;
  const i0 = Math.max(
    0,
    j.hourly.time.findIndex((t) => lireISO(t) >= new Date(depart)),
  );
  Object.assign(jours[0], {
    code: j.current.weather_code,
    temp: arrondi(j.current.temperature_2m),
    ressenti: arrondi(j.current.apparent_temperature),
    humidite: j.current.relative_humidity_2m,
    vent: arrondi(j.current.wind_speed_10m),
    jour: j.current.is_day === 1,
    pts: j.hourly.time
      .slice(i0, i0 + 13)
      .map((t, k) => ({
        date: lireISO(t),
        temp: j.hourly.temperature_2m[i0 + k],
        pluie: j.hourly.precipitation_probability[i0 + k] ?? 0,
      }))
      .filter((p): p is { date: Date; temp: number; pluie: number } => p.temp !== null),
  });

  return jours;
}
