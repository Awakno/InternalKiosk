// Le ruban : graphique SVG des températures horaires.
// Aujourd'hui : les 12h à venir avec le point « maintenant ».
// Les autres jours : la journée entière, 00h → 23h.

export function tracerRuban(pts, lever, coucher, aujourdhui) {
  const L = 1000, H = 145;
  const haut = 14, bas = 68, sol = 104, yTexte = 133;
  const marge = 40;

  const T = pts.map(p => p.temp);
  let tmin = Math.min(...T), tmax = Math.max(...T);
  if (tmax - tmin < 3) { const c = (tmax + tmin) / 2; tmin = c - 1.5; tmax = c + 1.5; }

  const X = i => marge + i * (L - marge*2) / (pts.length - 1);
  const Y = t => bas - (t - tmin) / (tmax - tmin) * (bas - haut);

  // Lissage Catmull-Rom → Bézier
  const co = pts.map((p, i) => [X(i), Y(p.temp)]);
  let d = `M${co[0][0]},${co[0][1]}`;
  for (let i = 0; i < co.length - 1; i++) {
    const p0 = co[i-1] || co[i], p1 = co[i], p2 = co[i+1], p3 = co[i+2] || co[i+1];
    d += ` C${p1[0]+(p2[0]-p0[0])/6},${p1[1]+(p2[1]-p0[1])/6} ${p2[0]-(p3[0]-p1[0])/6},${p2[1]-(p3[1]-p1[1])/6} ${p2[0]},${p2[1]}`;
  }

  // Barres de pluie : au-delà de 10% seulement, sinon c'est du bruit
  const large = pts.length > 15 ? 7 : 10;
  const pluie = pts.map((p, i) => p.pluie > 10
    ? `<rect x="${X(i)-large/2}" y="${sol - p.pluie/100*26}" width="${large}" height="${p.pluie/100*26}"
             rx="2.5" fill="var(--pluie)" opacity=".5"/>` : '').join('');

  // 24 points, une étiquette sur 4 ; 13 points, une sur 3
  const pas = pts.length > 15 ? 4 : 3;
  const heures = pts.map((p, i) => i % pas === 0
    ? `<text class="heure" x="${X(i)}" y="${yTexte}"
             text-anchor="${i === 0 ? 'start' : 'middle'}">${
        aujourdhui && i === 0 ? 'MAINT.' : String(p.date.getHours()).padStart(2,'0') + 'H'}</text>` : '').join('');

  // On n'étiquette que le plus chaud et le plus froid
  const iMax = T.indexOf(tmax), iMin = T.indexOf(tmin);
  const et = i => `<text class="degre" x="${X(i)}" y="${Y(T[i]) + (i === iMax ? -14 : 24)}"
                     text-anchor="middle">${Math.round(T[i])}°</text>`;
  const extremes = iMax === iMin ? '' : et(iMax) + et(iMin);

  const jalon = (date, glyphe) => {
    if (!date || date < pts[0].date || date > pts[pts.length-1].date) return '';
    const x = marge + (date - pts[0].date) / (pts[pts.length-1].date - pts[0].date) * (L - marge*2);
    return `<line x1="${x}" y1="6" x2="${x}" y2="${sol}" stroke="var(--accent)"
                  stroke-width="1.2" stroke-dasharray="2 6" opacity=".55"/>
            <text class="heure" x="${x}" y="${yTexte}" text-anchor="middle"
                  fill="var(--accent)" opacity=".8">${glyphe}</text>`;
  };

  // Le point « maintenant » n'a de sens que sur aujourd'hui
  const curseur = aujourdhui
    ? `<circle cx="${X(0)}" cy="${Y(T[0])}" r="10" fill="var(--accent)" opacity=".22"/>
       <circle cx="${X(0)}" cy="${Y(T[0])}" r="4.5" fill="var(--accent)"/>` : '';

  return `
    <svg viewBox="0 0 ${L} ${H}">
      <defs>
        <linearGradient id="sousCourbe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="currentColor" stop-opacity=".16"/>
          <stop offset="1" stop-color="currentColor" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <line x1="0" y1="${sol}" x2="${L}" y2="${sol}" stroke="var(--trait)" stroke-width="1"/>
      ${jalon(lever, '↑')}${jalon(coucher, '↓')}
      <path d="${d} L${X(pts.length-1)},${sol} L${X(0)},${sol} Z" fill="url(#sousCourbe)" stroke="none"/>
      ${pluie}
      <path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4"
            stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>
      ${curseur}
      ${extremes}
      ${heures}
    </svg>`;
}
