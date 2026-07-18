// Formatters utilitaires

// Une donnée API peut être absente (null), pas encore chargée (undefined)
// ou invalide (NaN) : dans ces trois cas, on ne l'affiche pas plutôt que
// de montrer "null"/"undefined"/"NaN" à l'écran.
export const disponible = v => v !== null && v !== undefined && !Number.isNaN(v);

export const fmtPrix = p => p.toFixed(2).replace('.', ',') + ' €';

export const joursEntre = (a, b) => Math.round((b - a) / 86400000);

// « Vacances de la Toussaint » → « TOUSSAINT »
export const nomCourt = nom =>
  nom.replace(/^(Début des )?Vacances (de la |de l'|d'|de )?/i, '').toUpperCase();

// Parse ISO datetime en heure locale (Open-Meteo renvoie "2026-07-17T14:00" sans fuseau)
export const lireISO = s => {
  const [d, h] = s.split('T');
  const [Y, M, J] = d.split('-');
  const [hh, mm] = h.split(':');
  return new Date(+Y, +M-1, +J, +hh, +mm);
};

// Indice européen de qualité de l'air (EAQI, ex. Open-Meteo european_aqi) :
// une échelle continue 0-100+, pas des codes 1-5. Seuils officiels
// EEA/Copernicus : 20 / 40 / 60 / 80 / 100.
const BANDES_AQI = [
  { max: 20,       label: 'Bon',                  emoji: '😊', description: 'Pas de restriction à prévoir.' },
  { max: 40,       label: 'Moyen',                 emoji: '🙂', description: 'Conditions globalement favorables.' },
  { max: 60,       label: 'Dégradé',               emoji: '😐', description: 'Les personnes sensibles peuvent être affectées.' },
  { max: 80,       label: 'Mauvais',               emoji: '😟', description: 'Éviter les activités prolongées en extérieur.' },
  { max: 100,      label: 'Très mauvais',          emoji: '😷', description: 'Limiter les sorties, surtout pour les personnes sensibles.' },
  { max: Infinity, label: 'Extrêmement mauvais',   emoji: '☠️', description: 'Rester à l\'intérieur autant que possible.' },
];

const bandeAQI = valeur => BANDES_AQI.find(b => valeur <= b.max) ?? BANDES_AQI[BANDES_AQI.length - 1];

export const indiceAQI = valeur => bandeAQI(valeur).label;
export const emojiAQI = valeur => bandeAQI(valeur).emoji;
export const descriptionAQI = valeur => bandeAQI(valeur).description;
