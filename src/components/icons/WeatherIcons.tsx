import type { ComponentType } from "react";

// Icônes météo -- portage JSX direct de lib/icons.js. Chaque icône est
// composée de formes de base (soleil, lune, nuage, pluie, neige, orage)
// combinées selon la condition Open-Meteo. Le SVG se mappe 1:1 en JSX,
// pas besoin de générer une chaîne HTML.

function Rayons({ cx, cy, r1, r2 }: { cx: number; cy: number; r1: number; r2: number }) {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={(cx + Math.cos(a) * r1).toFixed(1)}
            y1={(cy + Math.sin(a) * r1).toFixed(1)}
            x2={(cx + Math.cos(a) * r2).toFixed(1)}
            y2={(cy + Math.sin(a) * r2).toFixed(1)}
            stroke="var(--accent)"
            strokeWidth={2.8}
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

function Nuage({ dx = 0, dy = 0, s = 1 }: { dx?: number; dy?: number; s?: number }) {
  return (
    <g transform={`translate(${dx},${dy}) scale(${s})`} opacity={0.92}>
      <circle cx={24} cy={34} r={10} />
      <circle cx={37} cy={29} r={13} />
      <circle cx={46} cy={37} r={9} />
      <rect x={19} y={35} width={32} height={11} rx={5.5} />
    </g>
  );
}

function Gouttes({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={25 + i * 8} y1={51} x2={21 + i * 8} y2={60} stroke="var(--pluie)" strokeWidth={3.4} strokeLinecap="round" />
      ))}
    </>
  );
}

function Flocons({ n, fill = "currentColor" }: { n: number; fill?: string }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={25 + i * 8} cy={56} r={2.6} fill={fill} />
      ))}
    </>
  );
}

function Croissant({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s}) translate(-12,-12)`} fill="var(--accent)">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </g>
  );
}

export function IconSoleil() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <circle cx={32} cy={32} r={12} fill="var(--accent)" />
      <Rayons cx={32} cy={32} r1={17} r2={23} />
    </svg>
  );
}

export function IconLune() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <Croissant x={32} y={32} s={2.35} />
    </svg>
  );
}

export function IconSoleilNuages() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <circle cx={24} cy={22} r={8.5} fill="var(--accent)" />
      <Rayons cx={24} cy={22} r1={13} r2={17.5} />
      <Nuage dx={4} dy={8} s={0.92} />
    </svg>
  );
}

export function IconLuneNuages() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <Croissant x={23} y={21} s={1.35} />
      <Nuage dx={4} dy={8} s={0.92} />
    </svg>
  );
}

export function IconNuages() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <Nuage dx={0} dy={2} />
    </svg>
  );
}

export function IconBrouillard() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <g opacity={0.55}>
        <Nuage dx={0} dy={-3} />
      </g>
      <g stroke="currentColor" strokeWidth={3.4} strokeLinecap="round">
        <line x1={17} y1={49} x2={47} y2={49} />
        <line x1={22} y1={57} x2={52} y2={57} />
      </g>
    </svg>
  );
}

export function IconBruine() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <Nuage dx={0} dy={-4} />
      <Flocons n={3} fill="var(--pluie)" />
    </svg>
  );
}

export function IconPluie() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <Nuage dx={0} dy={-4} />
      <Gouttes n={3} />
    </svg>
  );
}

export function IconAverses() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <circle cx={20} cy={19} r={6.5} fill="var(--accent)" />
      <Rayons cx={20} cy={19} r1={10.5} r2={14} />
      <Nuage dx={5} dy={2} s={0.88} />
      <Gouttes n={2} />
    </svg>
  );
}

export function IconNeige() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <Nuage dx={0} dy={-4} />
      <Flocons n={3} />
    </svg>
  );
}

export function IconGresil() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <Nuage dx={0} dy={-4} />
      <Flocons n={3} fill="var(--pluie)" />
    </svg>
  );
}

export function IconOrage() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <Nuage dx={0} dy={-6} />
      <path d="M35 45 L26 58 h6 l-3 9 l12 -14 h-6 z" fill="var(--accent)" />
    </svg>
  );
}

const WEATHER_ICONS = {
  soleil: IconSoleil,
  lune: IconLune,
  soleil_nuages: IconSoleilNuages,
  lune_nuages: IconLuneNuages,
  nuages: IconNuages,
  brouillard: IconBrouillard,
  bruine: IconBruine,
  pluie: IconPluie,
  averses: IconAverses,
  neige: IconNeige,
  gresil: IconGresil,
  orage: IconOrage,
} satisfies Record<string, ComponentType>;

export type WeatherIconName = keyof typeof WEATHER_ICONS;

export interface MeteoInfo {
  nom: string;
  Icon: ComponentType;
}

// Traduit un code Open-Meteo (weather_code) en { nom, Icon }
export function meteo(code: number, jour: boolean): MeteoInfo {
  const t = (nom: string, icn: WeatherIconName): MeteoInfo => ({ nom, Icon: WEATHER_ICONS[icn] });
  switch (true) {
    case code === 0:
      return t("Ciel dégagé", jour ? "soleil" : "lune");
    case code === 1:
      return t("Peu nuageux", jour ? "soleil_nuages" : "lune_nuages");
    case code === 2:
      return t("Nuages épars", jour ? "soleil_nuages" : "lune_nuages");
    case code === 3:
      return t("Ciel couvert", "nuages");
    case [45, 48].includes(code):
      return t("Brouillard", "brouillard");
    case [51, 53, 55].includes(code):
      return t("Bruine", "bruine");
    case [56, 57].includes(code):
      return t("Bruine verglaçante", "gresil");
    case code === 61:
      return t("Pluie faible", "pluie");
    case code === 63:
      return t("Pluie", "pluie");
    case code === 65:
      return t("Pluie forte", "pluie");
    case [66, 67].includes(code):
      return t("Pluie verglaçante", "gresil");
    case code === 71:
      return t("Neige faible", "neige");
    case code === 73:
      return t("Neige", "neige");
    case code === 75:
      return t("Neige forte", "neige");
    case code === 77:
      return t("Grains de neige", "neige");
    case [80, 81].includes(code):
      return t("Averses", "averses");
    case code === 82:
      return t("Fortes averses", "pluie");
    case [85, 86].includes(code):
      return t("Averses de neige", "neige");
    case code === 95:
      return t("Orage", "orage");
    case [96, 99].includes(code):
      return t("Orage et grêle", "orage");
    default:
      return t("—", "nuages");
  }
}
