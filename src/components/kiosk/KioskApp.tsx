"use client";

import { useEffect } from "react";
import { CONFIG } from "@/lib/config";
import { fmtHM, fmtJour, getEffectiveAmbiance } from "@/lib/time";
import { computeAmbientStyle } from "@/lib/weather/ambient";
import { useWeather } from "@/hooks/useWeather";
import { useClockTick } from "@/hooks/useClockTick";
import { useModules } from "@/hooks/useModules";
import { useCarouselRotation } from "@/hooks/useCarouselRotation";
import { useBigClockOverlay } from "@/hooks/useBigClockOverlay";
import { useDetailOverlay } from "@/hooks/useDetailOverlay";
import { useSwipeDay } from "@/hooks/useSwipeDay";
import { useReturnToToday } from "@/hooks/useReturnToToday";
import { WeatherScreen } from "@/components/weather/WeatherScreen";
import { JoursNav } from "@/components/weather/JoursNav";
import { ModuleCarousel } from "@/components/kiosk/ModuleCarousel";
import { DetailOverlay } from "@/components/kiosk/DetailOverlay";
import { BigClockOverlay } from "@/components/kiosk/BigClockOverlay";
import { PanneScreen } from "@/components/kiosk/PanneScreen";

export default function KioskApp() {
  const weather = useWeather();
  const now = useClockTick(20_000);
  const widgets = useModules(now);
  const qualifiedCount = widgets.filter((w) => w.isReady && w.isRelevant).length;
  const activeIndex = useCarouselRotation(qualifiedCount, { intervalMs: 7000 });

  const bigClock = useBigClockOverlay();
  const detail = useDetailOverlay();

  const reveil = useReturnToToday(weather.currentDay, weather.goToDay, CONFIG.retourAujourd);

  const overlaysBlocking = detail.isOpen || bigClock.isOpen;
  const dragOverride = useSwipeDay({
    currentDay: weather.currentDay,
    dayCount: weather.data?.length ?? 1,
    onChangeDay: weather.goToDay,
    onInteract: reveil,
    disabled: overlaysBlocking,
    onDismissSwipe: (dx, dy) => {
      // Comportement distinct par overlay, comme dans l'ancien code : la
      // fenêtre détail se ferme sur un swipe ample, la grande horloge non
      // (elle ne se ferme qu'au tap, déjà géré par son propre onClick).
      if (detail.isOpen && (Math.abs(dx) > 40 || Math.abs(dy) > 40)) {
        detail.close();
        weather.goToDay(0);
      }
    },
  });

  // Ambiance (dégradé de fond + --accent) : recalculée à chaque tick
  // d'horloge, avec ou sans données météo (SOCLE de secours géré par
  // computeAmbientStyle si data est absente).
  useEffect(() => {
    const ambiance = getEffectiveAmbiance();
    const today = weather.data?.[0] ?? null;
    const style = computeAmbientStyle(today, now, ambiance);
    document.body.style.background = style.background;
    document.documentElement.style.setProperty("--accent", style.accent);
  }, [now, weather.data]);

  // Clavier : flèches pour naviguer les jours, Home pour revenir à
  // aujourd'hui, Échap pour fermer l'overlay actif.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") weather.goToDay(weather.currentDay + 1);
      if (e.key === "ArrowLeft") weather.goToDay(weather.currentDay - 1);
      if (e.key === "Home") weather.goToDay(0);
      if (e.key === "Escape" && detail.isOpen) {
        detail.close();
        weather.goToDay(0);
      }
      if (e.key === "Escape" && bigClock.isOpen) bigClock.close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [weather, detail, bigClock]);

  const heureTxt = fmtHM.format(now);
  const lieuText = weather.data
    ? `${CONFIG.location.name} · ${fmtJour.format(weather.data[weather.currentDay].date)}`
    : `${CONFIG.location.name} · ${fmtJour.format(now)}`;
  const lieuFutur = weather.data ? weather.currentDay !== 0 : false;

  return (
    <>
      <div id="ecran">
        <header id="bandeau">
          <div id="lieu" className={lieuFutur ? "futur" : ""}>
            {lieuText}
          </div>
          <div id="horloge" onClick={bigClock.open}>
            {heureTxt}
          </div>
        </header>

        {weather.data && (
          <>
            <WeatherScreen
              data={weather.data}
              currentDay={weather.currentDay}
              dragOverride={dragOverride}
              modulesSlot={<ModuleCarousel widgets={widgets} activeIndex={activeIndex} onOpen={detail.open} />}
            />
            <JoursNav count={weather.data.length} currentDay={weather.currentDay} />
          </>
        )}
      </div>

      <PanneScreen visible={!weather.data} />
      <DetailOverlay
        widgets={widgets}
        activeModuleId={detail.activeModuleId}
        isOpen={detail.isOpen}
        onClose={() => {
          detail.close();
          weather.goToDay(0);
        }}
      />
      <BigClockOverlay isOpen={bigClock.isOpen} heureTxt={heureTxt} onClose={bigClock.close} />
    </>
  );
}
