// Configuration du kiosque

export interface ModuleToggle {
  enabled: boolean;
}

export interface FuelConfig extends ModuleToggle {
  type: string;
  rayon: number;
}

export interface HolidaysConfig extends ModuleToggle {
  academie: string;
  zone: string;
}

export interface KioskConfig {
  location: {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  // 'ciel' : lueur du soleil avec variations. 'nuit' : noir constant
  ambiance: "ciel" | "nuit";
  nbJours: number;
  retourAujourd: number;
  rafraichir: number;
  modules: {
    weather: boolean;
    fuel: FuelConfig;
    holidays: HolidaysConfig;
    airQuality: ModuleToggle;
  };
}

export const CONFIG: KioskConfig = {
  location: {
    name: "Vaugrigneuse",
    latitude: 48.6244352,
    longitude: 2.1195366,
    timezone: "Europe/Paris",
  },

  ambiance: "ciel",

  nbJours: 5,
  retourAujourd: 45 * 1000,
  rafraichir: 10 * 60 * 1000,

  modules: {
    weather: true,
    fuel: { enabled: true, type: "sp98", rayon: 12000 },
    holidays: { enabled: true, academie: "Versailles", zone: "Zone C" },
    airQuality: { enabled: false },
  },
};
