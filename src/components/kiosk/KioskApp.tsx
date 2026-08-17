"use client";

import { useEffect } from "react";
import { CONFIG } from "@/lib/config";
import { fmtHM, fmtJour, getEffectiveAmbiance, getLuminositeOverride, getVeilleOverride } from "@/lib/time";
import { computeLuminosite, estNuit } from "@/lib/luminosite";
import { computeAmbientStyle } from "@/lib/weather/ambient";
import { useWeather } from "@/hooks/useWeather";
import { useClockTick } from "@/hooks/useClockTick";
import { useModules } from "@/hooks/useModules";
import { useCarouselRotation } from "@/hooks/useCarouselRotation";
import { useBigClockOverlay } from "@/hooks/useBigClockOverlay";
import { useDetailOverlay } from "@/hooks/useDetailOverlay";
import { useSwipeDay } from "@/hooks/useSwipeDay";
import { useActionsOverlay } from "@/hooks/useActionsOverlay";
import { useSwipeUp } from "@/hooks/useSwipeUp";
import { useReturnToToday } from "@/hooks/useReturnToToday";
import { useVeille } from "@/hooks/useVeille";
import { useLuminosite } from "@/hooks/useLuminosite";
import { WeatherScreen } from "@/components/weather/WeatherScreen";
import { JoursNav } from "@/components/weather/JoursNav";
import { ModuleCarousel } from "@/components/kiosk/ModuleCarousel";
import { DetailOverlay } from "@/components/kiosk/DetailOverlay";
import { ActionsOverlay } from "@/components/kiosk/ActionsOverlay";
import { BigClockOverlay } from "@/components/kiosk/BigClockOverlay";
import { VeilleOverlay } from "@/components/kiosk/VeilleOverlay";
import { FraicheurBadge } from "@/components/kiosk/FraicheurBadge";
import { PanneScreen } from "@/components/kiosk/PanneScreen";

export default function KioskApp() {
  const weather = useWeather();
  const now = useClockTick(20_000);
  const widgets = useModules(now);
  const qualifiedCount = widgets.filter((w) => w.isReady && w.isRelevant).length;

  const veilleDebug = getVeilleOverride();
  const isVeille = useVeille({
    enabled: CONFIG.veille.enabled && veilleDebug !== "off",
    delaiMs: typeof veilleDebug === "number" ? veilleDebug : CONFIG.veille.delai,
    autorise: !CONFIG.veille.seulementLaNuit || estNuit(now, CONFIG.luminosite),
  });

  // La veille impose son propre plancher de luminosité, sinon c'est le
  // profil horaire qui décide. ?lum= court-circuite les deux.
  const lumForcee = getLuminositeOverride();
  useLuminosite(lumForcee ?? (isVeille ? CONFIG.veille.luminosite : computeLuminosite(now, CONFIG.luminosite)));

  // Faire tourner le carrousel derrière un écran endormi ne sert à rien --
  // et au réveil, on retombe sur le widget qu'on avait laissé.
  const { activeIndex, selectionner } = useCarouselRotation(qualifiedCount, {
    intervalMs: CONFIG.carrousel.intervalMs,
    pauseApresTouche: CONFIG.carrousel.pauseApresTouche,
    paused: isVeille,
  });

  const bigClock = useBigClockOverlay();
  const detail = useDetailOverlay();
  const actions = useActionsOverlay();

  const reveil = useReturnToToday(weather.currentDay, weather.goToDay, CONFIG.retourAujourd);

  const overlaysBlocking = detail.isOpen || bigClock.isOpen || actions.isOpen;
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
  // Geste vertical indépendant du geste horizontal ci-dessus : ouvre/ferme
  // le tableau d'actions, désactivé seulement par les DEUX AUTRES overlays
  // (pas par actions.isOpen lui-même, sinon on ne pourrait jamais l'ouvrir).
  useSwipeUp({
    isOpen: actions.isOpen,
    onOpen: actions.open,
    onClose: actions.close,
    disabled: detail.isOpen || bigClock.isOpen,
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
      if (e.key === "Escape" && actions.isOpen) actions.close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [weather, detail, bigClock, actions]);

  const heureTxt = fmtHM.format(now);
  const lieuText = weather.data
    ? `${CONFIG.location.name} · ${fmtJour.format(weather.data[weather.currentDay].date)}`
    : `${CONFIG.location.name} · ${fmtJour.format(now)}`;
  const lieuFutur = weather.data ? weather.currentDay !== 0 : false;

  return (
    <>
      <div id="ecran">
        <header id="bandeau">
          <div id="lieu-bloc">
            <div id="lieu" className={lieuFutur ? "futur" : ""}>
              {lieuText}
            </div>
            <FraicheurBadge savedAt={weather.savedAt} isStale={weather.isStale} />
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
              modulesSlot={<ModuleCarousel widgets={widgets} activeIndex={activeIndex} onOpen={detail.open} onSelect={selectionner} />}
            />
            <JoursNav
              count={weather.data.length}
              currentDay={weather.currentDay}
              onSelect={(n) => {
                weather.goToDay(n);
                // Même réarmement que pour un balayage : consulter un jour
                // au doigt doit repousser le retour automatique à aujourd'hui.
                reveil();
              }}
            />
          </>
        )}

        {/* Affordance de secours : le geste de balayage vertical (useSwipeUp)
            n'est pas forcément découvert tout seul -- ce bouton donne le même
            accès en tap, en plus de servir d'indice visuel permanent. */}
        <button type="button" id="poignee-actions" aria-label="Ouvrir le tableau d'actions" onClick={actions.open}>
          <span />
        </button>
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
      <ActionsOverlay isOpen={actions.isOpen} onClose={actions.close} />
      <BigClockOverlay isOpen={bigClock.isOpen} heureTxt={heureTxt} onClose={bigClock.close} />
      <VeilleOverlay isOpen={isVeille} heureTxt={heureTxt} />
      {/* Voile d'assombrissement : au-dessus de tout le reste, y compris
          des overlays, pour que la luminosité soit celle de l'écran et pas
          celle d'un calque particulier. */}
      <div id="tamis" />
    </>
  );
}
