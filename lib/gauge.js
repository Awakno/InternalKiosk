// Jauge circulaire SVG — anneau de progression pour un pourcentage.
// Réutilisable pour n'importe quel module ayant une métrique 0-100%.

export function jaugeCirculaire(pourcentage, { taille = 120, epaisseur = 10, couleur = 'var(--accent)' } = {}) {
  const r = (taille - epaisseur) / 2;
  const cx = taille / 2, cy = taille / 2;
  const circonference = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pourcentage));
  const decalage = circonference * (1 - p / 100);

  return `
    <svg viewBox="0 0 ${taille} ${taille}" width="${taille}" height="${taille}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--trait)" stroke-width="${epaisseur}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${couleur}" stroke-width="${epaisseur}"
              stroke-linecap="round" stroke-dasharray="${circonference}" stroke-dashoffset="${decalage}"
              transform="rotate(-90 ${cx} ${cy})"/>
    </svg>`;
}
