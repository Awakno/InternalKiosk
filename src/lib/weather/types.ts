export interface HourPoint {
  date: Date;
  temp: number;
  pluie: number;
}

export interface WeatherDay {
  date: Date;
  code: number;
  max: number | null;
  min: number | null;
  pluie: number | null;
  vent: number | null;
  lever: Date;
  coucher: Date;
  pts: HourPoint[];
  // Uniquement rempli pour le jour 0 (aujourd'hui) :
  temp?: number | null;
  ressenti?: number | null;
  humidite?: number | null;
  jour?: boolean;
}
