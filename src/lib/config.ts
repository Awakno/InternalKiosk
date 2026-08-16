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

// Assombrissement nocturne. Le kiosque est une page web : elle ne peut pas
// piloter le rétroéclairage de la dalle, seulement voiler l'image. Pour
// éteindre vraiment le rétroéclairage, il faut un script côté Pi (voir
// README) -- ce réglage-ci reste utile en complément, et suffit seul.
export interface LuminositeConfig extends ModuleToggle {
  // Facteurs 0..1 (1 = image intacte, 0 = noir total).
  jour: number;
  nuit: number;
  // Heures décimales locales : 22.5 = 22 h 30.
  debutNuit: number;
  finNuit: number;
  // Durée du fondu de part et d'autre de chaque bascule, en minutes.
  transition: number;
}

export interface VeilleConfig extends ModuleToggle {
  delai: number;
  // Ne se met en veille que dans la plage nocturne définie ci-dessus :
  // en journée, un kiosque qui s'éteint tout seul n'a pas d'intérêt.
  seulementLaNuit: boolean;
  luminosite: number;
}

// Durées de vie des données en cache persistant, par module. Au-delà, on
// préfère ne rien afficher plutôt qu'une donnée devenue trompeuse.
export interface CacheConfig {
  weather: number;
  fuel: number;
  holidays: number;
  airQuality: number;
  // Sans mise à jour réseau réussie depuis ce délai, l'écran signale que
  // la donnée affichée est d'archive.
  perime: number;
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
  luminosite: LuminositeConfig;
  veille: VeilleConfig;
  cache: CacheConfig;
  modules: {
    weather: boolean;
    fuel: FuelConfig;
    holidays: HolidaysConfig;
    airQuality: ModuleToggle;
  };
}

const MINUTE = 60 * 1000;
const HEURE = 60 * MINUTE;
const JOUR = 24 * HEURE;

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
  rafraichir: 10 * MINUTE,

  luminosite: {
    enabled: true,
    jour: 1,
    nuit: 0.42,
    debutNuit: 22,
    finNuit: 7,
    transition: 45,
  },

  veille: {
    enabled: true,
    delai: 4 * MINUTE,
    seulementLaNuit: true,
    luminosite: 0.16,
  },

  cache: {
    // La météo est aussi bornée au jour calendaire (voir useWeather) : une
    // prévision de la veille est fausse même récente de quelques heures.
    weather: 12 * HEURE,
    fuel: JOUR,
    // Un calendrier scolaire ne bouge pas : il tient sans réseau une
    // saison entière.
    holidays: 60 * JOUR,
    airQuality: 6 * HEURE,
    perime: 25 * MINUTE,
  },

  modules: {
    weather: true,
    fuel: { enabled: true, type: "sp98", rayon: 12000 },
    holidays: { enabled: true, academie: "Versailles", zone: "Zone C" },
    airQuality: { enabled: false },
  },
};
