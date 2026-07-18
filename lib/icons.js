// Icônes météo — SVG générés, pas de fichiers externes
// Chaque icône est composée de formes de base (soleil, lune, nuage, pluie,
// neige, orage) combinées selon la condition Open-Meteo.

const svg = c => `<svg viewBox="0 0 64 64" fill="currentColor">${c}</svg>`;

const RAYONS = (cx, cy, r1, r2) => Array.from({length: 8}, (_, i) => {
  const a = i * Math.PI / 4;
  return `<line x1="${(cx+Math.cos(a)*r1).toFixed(1)}" y1="${(cy+Math.sin(a)*r1).toFixed(1)}"
                x2="${(cx+Math.cos(a)*r2).toFixed(1)}" y2="${(cy+Math.sin(a)*r2).toFixed(1)}"
                stroke="var(--accent)" stroke-width="2.8" stroke-linecap="round"/>`;
}).join('');

const NUAGE = (dx=0, dy=0, s=1) => `<g transform="translate(${dx},${dy}) scale(${s})" opacity=".92">
  <circle cx="24" cy="34" r="10"/><circle cx="37" cy="29" r="13"/>
  <circle cx="46" cy="37" r="9"/><rect x="19" y="35" width="32" height="11" rx="5.5"/>
</g>`;

const GOUTTES = n => Array.from({length: n}, (_, i) =>
  `<line x1="${25 + i*8}" y1="51" x2="${21 + i*8}" y2="60"
         stroke="var(--pluie)" stroke-width="3.4" stroke-linecap="round"/>`).join('');

const FLOCONS = (n, f = 'currentColor') => Array.from({length: n}, (_, i) =>
  `<circle cx="${25 + i*8}" cy="56" r="2.6" fill="${f}"/>`).join('');

const CROISSANT = (x, y, s) =>
  `<g transform="translate(${x},${y}) scale(${s}) translate(-12,-12)" fill="var(--accent)">
     <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></g>`;

export const ICONES = {
  soleil:        svg(`<circle cx="32" cy="32" r="12" fill="var(--accent)"/>${RAYONS(32,32,17,23)}`),
  lune:          svg(CROISSANT(32, 32, 2.35)),
  soleil_nuages: svg(`<circle cx="24" cy="22" r="8.5" fill="var(--accent)"/>${RAYONS(24,22,13,17.5)}${NUAGE(4,8,.92)}`),
  lune_nuages:   svg(`${CROISSANT(23, 21, 1.35)}${NUAGE(4,8,.92)}`),
  nuages:        svg(NUAGE(0, 2)),
  brouillard:    svg(`<g opacity=".55">${NUAGE(0,-3)}</g>
                      <g stroke="currentColor" stroke-width="3.4" stroke-linecap="round">
                        <line x1="17" y1="49" x2="47" y2="49"/><line x1="22" y1="57" x2="52" y2="57"/></g>`),
  bruine:        svg(`${NUAGE(0,-4)}${FLOCONS(3, 'var(--pluie)')}`),
  pluie:         svg(`${NUAGE(0,-4)}${GOUTTES(3)}`),
  averses:       svg(`<circle cx="20" cy="19" r="6.5" fill="var(--accent)"/>${RAYONS(20,19,10.5,14)}${NUAGE(5,2,.88)}${GOUTTES(2)}`),
  neige:         svg(`${NUAGE(0,-4)}${FLOCONS(3)}`),
  gresil:        svg(`${NUAGE(0,-4)}${FLOCONS(3, 'var(--pluie)')}`),
  orage:         svg(`${NUAGE(0,-6)}<path d="M35 45 L26 58 h6 l-3 9 l12 -14 h-6 z" fill="var(--accent)"/>`),
};

// Traduit un code Open-Meteo (weather_code) en { nom, icone }
export function meteo(code, jour) {
  const t = (nom, icn) => ({ nom, icone: ICONES[icn] });
  switch (true) {
    case code === 0:                return t('Ciel dégagé',        jour ? 'soleil' : 'lune');
    case code === 1:                return t('Peu nuageux',        jour ? 'soleil_nuages' : 'lune_nuages');
    case code === 2:                return t('Nuages épars',       jour ? 'soleil_nuages' : 'lune_nuages');
    case code === 3:                return t('Ciel couvert',       'nuages');
    case [45,48].includes(code):    return t('Brouillard',         'brouillard');
    case [51,53,55].includes(code): return t('Bruine',             'bruine');
    case [56,57].includes(code):    return t('Bruine verglaçante', 'gresil');
    case code === 61:               return t('Pluie faible',       'pluie');
    case code === 63:               return t('Pluie',              'pluie');
    case code === 65:               return t('Pluie forte',        'pluie');
    case [66,67].includes(code):    return t('Pluie verglaçante',  'gresil');
    case code === 71:               return t('Neige faible',       'neige');
    case code === 73:               return t('Neige',              'neige');
    case code === 75:               return t('Neige forte',        'neige');
    case code === 77:               return t('Grains de neige',    'neige');
    case [80,81].includes(code):    return t('Averses',            'averses');
    case code === 82:               return t('Fortes averses',     'pluie');
    case [85,86].includes(code):    return t('Averses de neige',   'neige');
    case code === 95:               return t('Orage',              'orage');
    case [96,99].includes(code):    return t('Orage et grêle',     'orage');
    default:                        return t('—',                  'nuages');
  }
}
