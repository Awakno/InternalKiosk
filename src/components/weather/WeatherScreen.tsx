"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { WeatherDay } from "@/lib/weather/types";
import { meteo } from "@/components/icons/WeatherIcons";
import { Ruban } from "@/components/charts/Ruban";
import { disponible } from "@/lib/format";

export interface WeatherScreenProps {
  data: WeatherDay[];
  currentDay: number;
  // #modules (le carrousel de widgets) vit à l'intérieur de #principal en
  // CSS (position absolue relative à #principal) -- ce slot préserve cette
  // relation sans coupler WeatherScreen au carrousel lui-même.
  modulesSlot?: ReactNode;
  // Aperçu de glissement en direct (useSwipeDay), appliqué par-dessus la
  // transition "posée" ci-dessous. Les deux ne sont jamais actifs en même
  // temps : dragOverride pendant un drag, sinon l'état interne géré ici.
  dragOverride?: { transform: string; opacity: number } | null;
}

// Reproduit la séquence visuelle de l'ancien goToDay() : le contenu du jour
// précédent glisse et s'estompe, PUIS (170ms) le nouveau contenu apparaît
// et glisse depuis le bord opposé. `renderedDay` traîne donc volontairement
// derrière `currentDay` pendant la transition.
export function WeatherScreen({ data, currentDay, modulesSlot, dragOverride }: WeatherScreenProps) {
  const [renderedDay, setRenderedDay] = useState(currentDay);
  const [glisse, setGlisse] = useState(false);
  const [transform, setTransform] = useState("translateX(0)");
  const [opacity, setOpacity] = useState(1);
  const prevDayRef = useRef(currentDay);

  useEffect(() => {
    const old = prevDayRef.current;
    prevDayRef.current = currentDay;
    if (old === currentDay) return;

    const sens = currentDay > old ? -1 : 1;
    setGlisse(true);
    setTransform(`translateX(${sens * 4}rem)`);
    setOpacity(0);

    const timer = setTimeout(() => {
      setRenderedDay(currentDay);
      setGlisse(false);
      setTransform(`translateX(${-sens * 4}rem)`);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setGlisse(true);
          setTransform("translateX(0)");
          setOpacity(1);
        });
      });
    }, 170);

    return () => clearTimeout(timer);
  }, [currentDay]);

  const d = data[renderedDay];
  const aujourdhui = renderedDay === 0;
  const m = meteo(d.code, aujourdhui ? !!d.jour : true);
  const { Icon } = m;

  const mesures = aujourdhui
    ? [
        disponible(d.ressenti) && `Ressenti ${d.ressenti}°`,
        disponible(d.max) && disponible(d.min) && `${d.max}° / ${d.min}°`,
        disponible(d.vent) && `Vent ${d.vent} km/h`,
        disponible(d.humidite) && `Humidité ${d.humidite}%`,
      ].filter((v): v is string => !!v)
    : [disponible(d.pluie) && `Pluie ${d.pluie}%`, disponible(d.vent) && `Vent ${d.vent} km/h`].filter((v): v is string => !!v);

  const effectiveTransform = dragOverride?.transform ?? transform;
  const effectiveOpacity = dragOverride?.opacity ?? opacity;

  return (
    <div id="pages" className={!dragOverride && glisse ? "glisse" : ""} style={{ transform: effectiveTransform, opacity: effectiveOpacity }}>
      <main id="principal">
        <div id="icone">
          <Icon />
        </div>
        <div>
          <div id="temperature">
            {aujourdhui ? (
              disponible(d.temp) ? (
                <>
                  {d.temp}
                  <i>°</i>
                </>
              ) : (
                <>
                  —<i>°</i>
                </>
              )
            ) : disponible(d.max) && disponible(d.min) ? (
              <>
                {d.max}
                <i>°</i>
                <b>{d.min}°</b>
              </>
            ) : disponible(d.max) ? (
              <>
                {d.max}
                <i>°</i>
              </>
            ) : (
              <>
                —<i>°</i>
              </>
            )}
          </div>
          <div id="condition">{m.nom}</div>
          <div id="mesures">
            {mesures.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
        {modulesSlot}
      </main>
      <section id="ruban">{d.pts.length > 2 && <Ruban pts={d.pts} lever={d.lever} coucher={d.coucher} aujourdhui={aujourdhui} />}</section>
    </div>
  );
}

// Texte du bandeau #lieu : le jour REGARDÉ, pas le jour courant réel.
export function getLieuText(data: WeatherDay[], currentDay: number, locationName: string, fmtJour: Intl.DateTimeFormat): string {
  return `${locationName} · ${fmtJour.format(data[currentDay].date)}`;
}

export function isFutureDay(currentDay: number): boolean {
  return currentDay !== 0;
}
