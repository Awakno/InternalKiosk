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

// Indice qualité air en français
export const indiceAQI = code => {
  const indices = {
    1: 'Excellent',
    2: 'Bon',
    3: 'Modéré',
    4: 'Mauvais',
    5: 'Très mauvais',
  };
  return indices[code] || 'Inconnu';
};

// Emoji pour indice AQI
export const emojiAQI = code => {
  const emojis = { 1: '😊', 2: '🙂', 3: '😐', 4: '😟', 5: '😷' };
  return emojis[code] || '❓';
};
