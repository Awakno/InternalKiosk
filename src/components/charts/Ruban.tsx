import type { HourPoint } from "@/lib/weather/types";

// Le ruban : graphique SVG des températures horaires. Portage JSX direct
// de lib/ruban.js (tracerRuban) -- même géométrie, mêmes constantes.
// Aujourd'hui : les 12h à venir avec le point « maintenant ».
// Les autres jours : la journée entière, 00h → 23h.

export interface RubanProps {
  pts: HourPoint[];
  lever: Date | null;
  coucher: Date | null;
  aujourdhui: boolean;
}

export function Ruban({ pts, lever, coucher, aujourdhui }: RubanProps) {
  const L = 1000,
    H = 190;
  const haut = 18,
    bas = 89,
    sol = 136,
    yTexte = 174;
  const marge = 40;

  const T = pts.map((p) => p.temp);
  let tmin = Math.min(...T),
    tmax = Math.max(...T);
  if (tmax - tmin < 3) {
    const c = (tmax + tmin) / 2;
    tmin = c - 1.5;
    tmax = c + 1.5;
  }

  const X = (i: number) => marge + (i * (L - marge * 2)) / (pts.length - 1);
  const Y = (t: number) => bas - ((t - tmin) / (tmax - tmin)) * (bas - haut);

  // Lissage Catmull-Rom → Bézier
  const co: [number, number][] = pts.map((p, i) => [X(i), Y(p.temp)]);
  let d = `M${co[0][0]},${co[0][1]}`;
  for (let i = 0; i < co.length - 1; i++) {
    const p0 = co[i - 1] || co[i],
      p1 = co[i],
      p2 = co[i + 1],
      p3 = co[i + 2] || co[i + 1];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }

  // Barres de pluie : au-delà de 10% seulement, sinon c'est du bruit
  const large = pts.length > 15 ? 7 : 10;
  const pluieBars = pts.map((p, i) =>
    p.pluie > 10 ? (
      <rect
        key={i}
        x={X(i) - large / 2}
        y={sol - (p.pluie / 100) * 34}
        width={large}
        height={(p.pluie / 100) * 34}
        rx={2.5}
        fill="var(--pluie)"
        opacity={0.5}
      />
    ) : null,
  );

  // 24 points, une étiquette sur 4 ; 13 points, une sur 3
  const pas = pts.length > 15 ? 4 : 3;
  const heures = pts.map((p, i) =>
    i % pas === 0 ? (
      <text key={i} className="heure" x={X(i)} y={yTexte} textAnchor={i === 0 ? "start" : "middle"}>
        {aujourdhui && i === 0 ? "MAINT." : String(p.date.getHours()).padStart(2, "0") + "H"}
      </text>
    ) : null,
  );

  // On n'étiquette que le plus chaud et le plus froid
  const iMax = T.indexOf(tmax),
    iMin = T.indexOf(tmin);
  const et = (i: number) => (
    <text key={`ex-${i}`} className="degre" x={X(i)} y={Y(T[i]) + (i === iMax ? -18 : 31)} textAnchor="middle">
      {Math.round(T[i])}°
    </text>
  );
  const extremes = iMax === iMin ? null : (
    <>
      {et(iMax)}
      {et(iMin)}
    </>
  );

  const jalon = (date: Date | null, glyphe: string, cle: string) => {
    if (!date || date < pts[0].date || date > pts[pts.length - 1].date) return null;
    const x = marge + ((date.getTime() - pts[0].date.getTime()) / (pts[pts.length - 1].date.getTime() - pts[0].date.getTime())) * (L - marge * 2);
    return (
      <g key={cle}>
        <line x1={x} y1={6} x2={x} y2={sol} stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="2 6" opacity={0.55} />
        <text className="heure" x={x} y={yTexte} textAnchor="middle" fill="var(--accent)" opacity={0.8}>
          {glyphe}
        </text>
      </g>
    );
  };

  // Le point « maintenant » n'a de sens que sur aujourd'hui
  const curseur = aujourdhui ? (
    <>
      <circle cx={X(0)} cy={Y(T[0])} r={10} fill="var(--accent)" opacity={0.22} />
      <circle cx={X(0)} cy={Y(T[0])} r={4.5} fill="var(--accent)" />
    </>
  ) : null;

  return (
    <svg viewBox={`0 0 ${L} ${H}`}>
      <defs>
        <linearGradient id="sousCourbe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity={0.16} />
          <stop offset="1" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={0} y1={sol} x2={L} y2={sol} stroke="var(--trait)" strokeWidth={1} />
      {jalon(lever, "↑", "lever")}
      {jalon(coucher, "↓", "coucher")}
      <path d={`${d} L${X(pts.length - 1)},${sol} L${X(0)},${sol} Z`} fill="url(#sousCourbe)" stroke="none" />
      {pluieBars}
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      {curseur}
      {extremes}
      {heures}
    </svg>
  );
}
