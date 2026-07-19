import { descriptionAQI, disponible, emojiAQI, indiceAQI } from "@/lib/format";
import type { AirQualityData } from "@/lib/airquality/types";

export function AirQualityDetail({ data }: { data: AirQualityData }) {
  if (!disponible(data.aqi)) return null;
  return (
    <>
      <h2>Qualité de l&rsquo;air</h2>
      <div className="sous">Indice européen AQI</div>
      <div className="ligne">
        <div className="principal">
          {emojiAQI(data.aqi)} {indiceAQI(data.aqi)}
        </div>
        <div className="detail">Indice: {data.aqi}</div>
      </div>
      <div style={{ marginTop: "1.5rem", fontSize: "1.3rem", lineHeight: 1.5, color: "var(--doux)" }}>{descriptionAQI(data.aqi)}</div>
    </>
  );
}
