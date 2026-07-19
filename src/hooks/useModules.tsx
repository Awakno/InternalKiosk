"use client";

import type { ReactNode } from "react";
import { useFuel } from "./useFuel";
import { useHolidays } from "./useHolidays";
import { useAirQuality } from "./useAirQuality";
import { FuelCard } from "@/components/modules/fuel/FuelCard";
import { FuelDetail } from "@/components/modules/fuel/FuelDetail";
import { HolidaysCard } from "@/components/modules/holidays/HolidaysCard";
import { HolidaysDetail } from "@/components/modules/holidays/HolidaysDetail";
import { AirQualityCard } from "@/components/modules/airquality/AirQualityCard";
import { AirQualityDetail } from "@/components/modules/airquality/AirQualityDetail";

export interface WidgetEntry {
  id: string;
  isReady: boolean;
  isRelevant: boolean;
  renderCard: () => ReactNode;
  renderDetail: () => ReactNode;
}

// Les hooks ne peuvent pas être appelés conditionnellement ni depuis un
// tableau construit dynamiquement -- ensemble fixe d'appels de hooks
// frères, chacun se court-circuitant individuellement sur son propre
// CONFIG.modules.x.enabled (voir chaque hook).
export function useModules(now: Date): WidgetEntry[] {
  const fuel = useFuel();
  const holidays = useHolidays(now);
  const airQuality = useAirQuality();

  return [
    {
      id: "fuel",
      isReady: fuel.isReady,
      isRelevant: fuel.isRelevant,
      renderCard: () => fuel.data && <FuelCard data={fuel.data} />,
      renderDetail: () => fuel.data && <FuelDetail data={fuel.data} />,
    },
    {
      id: "holidays",
      isReady: holidays.isReady,
      isRelevant: holidays.isRelevant,
      renderCard: () => holidays.data && <HolidaysCard data={holidays.data} now={now} />,
      renderDetail: () => holidays.data && <HolidaysDetail data={holidays.data} now={now} />,
    },
    {
      id: "airQuality",
      isReady: airQuality.isReady,
      isRelevant: airQuality.isRelevant,
      renderCard: () => airQuality.data && <AirQualityCard data={airQuality.data} />,
      renderDetail: () => airQuality.data && <AirQualityDetail data={airQuality.data} />,
    },
  ];
}
