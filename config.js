// Configuration du kiosque
export const CONFIG = {
  location: {
    name: "Vaugrigneuse",
    latitude: 48.6244352,
    longitude: 2.1195366,
    timezone: "Europe/Paris",
  },

  // 'ciel' : lueur du soleil avec variations. 'nuit' : noir constant
  ambiance: 'ciel',

  // Swipe + modules
  nbJours: 5,
  retourAujourd: 45 * 1000,
  rafraichir: 10 * 60 * 1000,

  // Modules actifs
  modules: {
    weather: true,
    fuel: { enabled: true, type: 'sp98', rayon: 12000 },
    holidays: { enabled: true, academie: 'Versailles', zone: 'Zone C' },
    airQuality: { enabled: true },
  },
};

// Parse query args (ex: ?ambiance=nuit, ?heure=6.5)
const args = new URLSearchParams(location.search);
if (args.has('ambiance')) CONFIG.ambiance = args.get('ambiance');

export const ARGS = args;

export function maintenant() {
  const n = new Date();
  if (ARGS.has('heure')) {
    const h = parseFloat(ARGS.get('heure'));
    n.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
  }
  return n;
}

// Formatters globaux
export const fmtJour = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long',
  timeZone: CONFIG.location.timezone
});

export const fmtHM = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit', minute: '2-digit',
  timeZone: CONFIG.location.timezone
});

export const fmtDateCourt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric', month: 'short',
  timeZone: CONFIG.location.timezone
});
