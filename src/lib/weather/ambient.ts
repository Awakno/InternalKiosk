import { oklch, lerp, lerpH } from "@/lib/color";
import type { WeatherDay } from "./types";

interface Phase {
  ref: "LEV" | "MID" | "COU";
  min: number;
  L: number;
  C: number;
  H: number;
  i: number;
  aC: number;
  aH: number;
}

const PHASES: Phase[] = [
  { ref: "LEV", min: -70, L: 0.55, C: 0.045, H: 265, i: 0.05, aC: 0.055, aH: 258 },
  { ref: "LEV", min: -25, L: 0.55, C: 0.13, H: 322, i: 0.2, aC: 0.06, aH: 285 },
  { ref: "LEV", min: 15, L: 0.72, C: 0.17, H: 42, i: 0.44, aC: 0.13, aH: 45 },
  { ref: "LEV", min: 90, L: 0.86, C: 0.085, H: 68, i: 0.3, aC: 0.115, aH: 60 },
  { ref: "MID", min: 0, L: 0.95, C: 0.045, H: 82, i: 0.22, aC: 0.1, aH: 70 },
  { ref: "COU", min: -90, L: 0.86, C: 0.085, H: 62, i: 0.3, aC: 0.115, aH: 58 },
  { ref: "COU", min: -15, L: 0.7, C: 0.18, H: 34, i: 0.47, aC: 0.13, aH: 38 },
  { ref: "COU", min: 25, L: 0.52, C: 0.14, H: 352, i: 0.22, aC: 0.07, aH: 300 },
  { ref: "COU", min: 70, L: 0.55, C: 0.045, H: 265, i: 0.05, aC: 0.055, aH: 258 },
];

export const SOCLE = "linear-gradient(178deg,#070910 0%,#0A0E16 60%,#0D121C 100%)";

export interface AmbientStyle {
  background: string;
  accent: string;
}

// Portage pur de elairer() : calcule le dégradé + l'accent, sans toucher au
// DOM. L'effet de bord (document.body.style.background / --accent) est
// appliqué par l'appelant (un useEffect), pas ici.
export function computeAmbientStyle(
  today: WeatherDay | null,
  now: Date,
  ambiance: "ciel" | "nuit",
): AmbientStyle {
  if (!today || ambiance === "nuit") {
    return { background: SOCLE, accent: "#C6D4E8" };
  }

  const { lever, coucher } = today;
  if (!lever || !coucher) {
    return { background: SOCLE, accent: "#C6D4E8" };
  }

  const midi = new Date((lever.getTime() + coucher.getTime()) / 2);
  const ancre = { LEV: lever, COU: coucher, MID: midi };
  const pts = PHASES.map((p) => ({ ...p, t: ancre[p.ref].getTime() + p.min * 60000 })).sort((a, b) => a.t - b.t);

  const t = now.getTime();
  let a = pts[0],
    b = pts[0],
    k = 0;
  if (t >= pts[pts.length - 1].t) {
    a = b = pts[pts.length - 1];
  } else if (t > pts[0].t) {
    for (let i = 0; i < pts.length - 1; i++) {
      if (t <= pts[i + 1].t) {
        a = pts[i];
        b = pts[i + 1];
        k = (t - a.t) / (b.t - a.t);
        break;
      }
    }
  }

  const L = lerp(a.L, b.L, k),
    C = lerp(a.C, b.C, k);
  const H = lerpH(a.H, b.H, k),
    i = lerp(a.i, b.i, k);
  const course = (t - lever.getTime()) / (coucher.getTime() - lever.getTime());
  const x = (Math.min(1.12, Math.max(-0.12, course)) * 100).toFixed(1);

  const background = [
    `radial-gradient(52% 62% at ${x}% 108%, ${oklch(L, C, H, i)} 0%, ${oklch(L, C * 0.8, H, i * 0.34)} 42%, transparent 74%)`,
    `radial-gradient(150% 130% at 50% 126%, ${oklch(L, C * 0.55, H, i * 0.24)} 0%, transparent 68%)`,
    SOCLE,
  ].join(",");

  const accent = oklch(0.84, lerp(a.aC, b.aC, k), lerpH(a.aH, b.aH, k));

  return { background, accent };
}
