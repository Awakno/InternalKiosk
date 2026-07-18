// Couleur — OKLCH → sRGB
// Mélanger deux teintes en RGB traverse le gris. En OKLCH on interpole
// la teinte sur le cercle, donc bleu → orange passe par violet/rouge
// comme un vrai ciel, jamais par la boue.

export function oklch(L, C, H, a = 1) {
  const h = H * Math.PI / 180;
  const x = C * Math.cos(h), y = C * Math.sin(h);
  const l = (L + 0.3963377774*x + 0.2158037573*y) ** 3;
  const m = (L - 0.1055613458*x - 0.0638541728*y) ** 3;
  const s = (L - 0.0894841775*x - 1.2914855480*y) ** 3;

  const canal = v => {
    v = v <= 0.0031308 ? 12.92*v : 1.055 * Math.pow(Math.max(v, 0), 1/2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  };

  const r  = canal( 4.0767416621*l - 3.3077115913*m + 0.2309699292*s);
  const g  = canal(-1.2684380046*l + 2.6097574011*m - 0.3413193965*s);
  const bl = canal(-0.0041960863*l - 0.7034186147*m + 1.7076147010*s);
  return `rgba(${r},${g},${bl},${a.toFixed(3)})`;
}

export const lerp  = (a, b, t) => a + (b - a) * t;
export const lerpH = (a, b, t) => {
  let d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

export const distanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371, rad = d => d * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
