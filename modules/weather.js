import { Module } from './base.js';
import { CONFIG, fmtJour, fmtHM, maintenant } from '../config.js';
import { fetchJSON } from '../lib/fetch.js';
import { lireISO } from '../lib/format.js';
import { oklch, lerp, lerpH } from '../lib/color.js';

const ICONES = {
  soleil:        '<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="32" cy="32" r="12" fill="var(--accent)"/><g opacity=".8">'+Array.from({length:8},(_, i)=>{const a=i*Math.PI/4;return`<line x1="${(32+Math.cos(a)*17).toFixed(1)}" y1="${(32+Math.sin(a)*17).toFixed(1)}" x2="${(32+Math.cos(a)*23).toFixed(1)}" y2="${(32+Math.sin(a)*23).toFixed(1)}" stroke="var(--accent)" stroke-width="2.8" stroke-linecap="round"/>`}).join('')+'</g></svg>',
  lune:          '<svg viewBox="0 0 64 64" fill="var(--accent)"><g transform="translate(32, 32) scale(2.35) translate(-12,-12)"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></g></svg>',
  soleil_nuages: '<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="24" cy="22" r="8.5" fill="var(--accent)"/><line x1="24" y1="9" x2="24" y2="3" stroke="var(--accent)" stroke-width="2.8" stroke-linecap="round"/></svg>',
  lune_nuages:   '<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="23" cy="21" r="6.5" fill="var(--accent)"/></svg>',
  nuages:        '<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="24" cy="34" r="10"/><circle cx="37" cy="29" r="13"/><circle cx="46" cy="37" r="9"/></svg>',
  pluie:         '<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="24" cy="34" r="10" opacity=".7"/><line x1="25" y1="51" x2="21" y2="60" stroke="var(--pluie)" stroke-width="3.4" stroke-linecap="round"/></svg>',
  neige:         '<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="24" cy="34" r="10" opacity=".7"/><circle cx="25" cy="56" r="2.6"/></svg>',
  orage:         '<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="20" cy="19" r="6.5" fill="var(--accent)"/><path d="M35 45 L26 58 h6 l-3 9 l12 -14 h-6 z" fill="var(--accent)"/></svg>',
};

const PHASES = [
  { ref:'LEV', min: -70, L:.55, C:.045, H:265, i:.05, aC:.055, aH:258 },
  { ref:'LEV', min: -25, L:.55, C:.130, H:322, i:.20, aC:.060, aH:285 },
  { ref:'LEV', min:  15, L:.72, C:.170, H: 42, i:.44, aC:.130, aH: 45 },
  { ref:'LEV', min:  90, L:.86, C:.085, H: 68, i:.30, aC:.115, aH: 60 },
  { ref:'MID', min:   0, L:.95, C:.045, H: 82, i:.22, aC:.100, aH: 70 },
  { ref:'COU', min: -90, L:.86, C:.085, H: 62, i:.30, aC:.115, aH: 58 },
  { ref:'COU', min: -15, L:.70, C:.180, H: 34, i:.47, aC:.130, aH: 38 },
  { ref:'COU', min:  25, L:.52, C:.140, H:352, i:.22, aC:.070, aH:300 },
  { ref:'COU', min:  70, L:.55, C:.045, H:265, i:.05, aC:.055, aH:258 },
];

const SOCLE = 'linear-gradient(178deg,#070910 0%,#0A0E16 60%,#0D121C 100%)';

export class WeatherModule extends Module {
  constructor() {
    super('weather', CONFIG.modules.weather);
    this.currentDay = 0;
  }

  async load() {
    const url = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
      latitude: CONFIG.location.latitude,
      longitude: CONFIG.location.longitude,
      timezone: CONFIG.location.timezone,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
      hourly: 'temperature_2m,precipitation_probability',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max',
      forecast_days: CONFIG.nbJours,
    });

    const j = await fetchJSON(url);

    const heuresDe = cle => j.hourly.time
      .map((t, i) => ({ t, i }))
      .filter(o => o.t.startsWith(cle))
      .map(o => ({ date: lireISO(o.t), temp: j.hourly.temperature_2m[o.i], pluie: j.hourly.precipitation_probability[o.i] ?? 0 }))
      .filter(p => p.temp !== null);

    const jours = j.daily.time.map((cle, n) => ({
      date: lireISO(cle + 'T12:00'),
      code: j.daily.weather_code[n],
      max: Math.round(j.daily.temperature_2m_max[n]),
      min: Math.round(j.daily.temperature_2m_min[n]),
      pluie: j.daily.precipitation_probability_max[n] ?? 0,
      vent: Math.round(j.daily.wind_speed_10m_max[n]),
      lever: lireISO(j.daily.sunrise[n]),
      coucher: lireISO(j.daily.sunset[n]),
      pts: heuresDe(cle),
    }));

    const depart = maintenant().getTime() - 3600e3;
    const i0 = Math.max(0, j.hourly.time.findIndex(t => lireISO(t) >= new Date(depart)));
    Object.assign(jours[0], {
      code: j.current.weather_code,
      temp: Math.round(j.current.temperature_2m),
      ressenti: Math.round(j.current.apparent_temperature),
      humidite: j.current.relative_humidity_2m,
      vent: Math.round(j.current.wind_speed_10m),
      jour: j.current.is_day === 1,
      pts: j.hourly.time.slice(i0, i0 + 13).map((t, k) => ({
        date: lireISO(t),
        temp: j.hourly.temperature_2m[i0 + k],
        pluie: j.hourly.precipitation_probability[i0 + k] ?? 0,
      })).filter(p => p.temp !== null),
    });

    this.data = jours;
    this.currentDay = Math.min(this.currentDay, jours.length - 1);
  }

  meteo(code, jour) {
    const t = (nom, icn) => ({ nom, icone: ICONES[icn] });
    switch (true) {
      case code === 0: return t('Ciel dégagé', jour ? 'soleil' : 'lune');
      case code === 1 || code === 2: return t('Peu nuageux', jour ? 'soleil_nuages' : 'lune_nuages');
      case code === 3: return t('Ciel couvert', 'nuages');
      case [45, 48].includes(code): return t('Brouillard', 'nuages');
      case [51, 53, 55, 61, 63, 65, 66, 67].includes(code): return t('Pluie', 'pluie');
      case [71, 73, 75, 77, 80, 81, 82, 85, 86].includes(code): return t('Neige', 'neige');
      case [95, 96, 99].includes(code): return t('Orage', 'orage');
      default: return t('—', 'nuages');
    }
  }

  elairer(n) {
    if (!this.data || CONFIG.ambiance === 'nuit') {
      document.body.style.background = SOCLE;
      document.documentElement.style.setProperty('--accent', '#C6D4E8');
      return;
    }

    const d = this.data[0];
    if (!d.lever || !d.coucher) {
      document.body.style.background = SOCLE;
      return;
    }

    const midi = new Date((d.lever.getTime() + d.coucher.getTime()) / 2);
    const ancre = { LEV: d.lever, COU: d.coucher, MID: midi };
    const pts = PHASES.map(p => ({ ...p, t: ancre[p.ref].getTime() + p.min * 60000 })).sort((a, b) => a.t - b.t);

    const t = n.getTime();
    let a = pts[0], b = pts[0], k = 0;
    if (t >= pts[pts.length-1].t) a = b = pts[pts.length-1];
    else if (t > pts[0].t) {
      for (let i = 0; i < pts.length - 1; i++) {
        if (t <= pts[i+1].t) { a = pts[i]; b = pts[i+1]; k = (t - a.t) / (b.t - a.t); break; }
      }
    }

    const L = lerp(a.L, b.L, k), C = lerp(a.C, b.C, k);
    const H = lerpH(a.H, b.H, k), i = lerp(a.i, b.i, k);
    const course = (t - d.lever.getTime()) / (d.coucher.getTime() - d.lever.getTime());
    const x = (Math.min(1.12, Math.max(-.12, course)) * 100).toFixed(1);

    document.body.style.background = [
      `radial-gradient(52% 62% at ${x}% 108%, ${oklch(L, C, H, i)} 0%, ${oklch(L, C*.8, H, i*.34)} 42%, transparent 74%)`,
      `radial-gradient(150% 130% at 50% 126%, ${oklch(L, C*.55, H, i*.24)} 0%, transparent 68%)`,
      SOCLE,
    ].join(',');

    document.documentElement.style.setProperty('--accent', oklch(.84, lerp(a.aC, b.aC, k), lerpH(a.aH, b.aH, k)));
  }

  renderCard() {
    if (!this.data) return null;
    const d = this.data[this.currentDay];
    return {
      label: 'Météo',
      valeur: `${d.temp}°${this.currentDay === 0 ? '' : ' · ' + d.max + '°'}`
    };
  }

  renderDetail() {
    if (!this.data) return '';
    const d = this.data[this.currentDay];
    const m = this.meteo(d.code, this.currentDay === 0 ? d.jour : true);

    const lines = this.currentDay === 0
      ? [`Ressenti ${d.ressenti}°`, `${d.max}° / ${d.min}°`, `Vent ${d.vent} km/h`, `Humidité ${d.humidite}%`]
      : [`Pluie ${d.pluie}%`, `Vent ${d.vent} km/h`, `Lever ${fmtHM.format(d.lever)}`, `Coucher ${fmtHM.format(d.coucher)}`];

    let html = `<h2>${fmtJour.format(d.date)}</h2><div class="sous">${m.nom}</div>`;
    lines.forEach(line => {
      html += `<div class="ligne"><div class="principal">${line}</div></div>`;
    });
    return html;
  }

  renderPage() {
    if (!this.data) return;
    const d = this.data[this.currentDay];
    const m = this.meteo(d.code, this.currentDay === 0 ? d.jour : true);

    document.getElementById('icone').innerHTML = m.icone;
    document.getElementById('condition').textContent = m.nom;

    if (this.currentDay === 0) {
      document.getElementById('temperature').innerHTML = `${d.temp}<i>°</i>`;
      const mesures = [`Ressenti ${d.ressenti}°`, `${d.max}° / ${d.min}°`, `Vent ${d.vent} km/h`, `Humidité ${d.humidite}%`];
      document.getElementById('mesures').innerHTML = mesures.map(t => `<span>${t}</span>`).join('');
    } else {
      document.getElementById('temperature').innerHTML = `${d.max}<i>°</i><b>${d.min}°</b>`;
      const mesures = [`Pluie ${d.pluie}%`, `Vent ${d.vent} km/h`];
      document.getElementById('mesures').innerHTML = mesures.map(t => `<span>${t}</span>`).join('');
    }

    document.getElementById('lieu').textContent = `${CONFIG.location.name} · ${fmtJour.format(d.date)}`;
    document.getElementById('lieu').classList.toggle('futur', this.currentDay !== 0);
    document.querySelectorAll('#jours span').forEach((s, i) => s.classList.toggle('actif', i === this.currentDay));
  }

  goToDay(n) {
    if (!this.data) return;
    const old = this.currentDay;
    this.currentDay = Math.max(0, Math.min(this.data.length - 1, n));
    if (this.currentDay === old) return;

    const pages = document.getElementById('pages');
    const sens = this.currentDay > old ? -1 : 1;
    pages.classList.add('glisse');
    pages.style.transform = `translateX(${sens * 4}rem)`;
    pages.style.opacity = '0';

    setTimeout(() => {
      this.renderPage();
      pages.classList.remove('glisse');
      pages.style.transform = `translateX(${-sens * 4}rem)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pages.classList.add('glisse');
          pages.style.transform = 'translateX(0)';
          pages.style.opacity = '1';
        });
      });
    }, 170);
  }
}
