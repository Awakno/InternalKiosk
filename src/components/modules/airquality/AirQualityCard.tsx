import { disponible, emojiAQI, indiceAQI } from "@/lib/format";
import type { AirQualityData } from "@/lib/airquality/types";

export function AirQualityCard({ data }: { data: AirQualityData }) {
  if (!disponible(data.aqi)) return null;
  return (
    <>
      <span className="label">Qualité de l&rsquo;air</span>
      <span className="valeur">
        {emojiAQI(data.aqi)} {indiceAQI(data.aqi)}
      </span>
    </>
  );
}
