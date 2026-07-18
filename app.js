import { CONFIG, ARGS, maintenant, fmtHM, fmtJour } from './config.js';
import { WeatherModule } from './modules/weather.js';
import { FuelModule } from './modules/fuel.js';
import { HolidaysModule } from './modules/holidays.js';
import { AirQualityModule } from './modules/airquality.js';
import { Module } from './modules/base.js';
import { createText, createDiv, clearAndAppend, safeHTML } from './lib/dom.js';

// ───────────────────────────────────────── Initialisation ─────────────────────────────────────

// La météo pilote l'écran principal directement (renderPage/goToDay/elairer) ;
// elle ne fait PAS partie du petit carrousel latéral (celui-ci n'affiche que
// les widgets secondaires, sinon la temp. dupliquée y perd son contexte
// "aujourd'hui vs prévision" et affiche "undefined°" sur les jours futurs).
const weather = new WeatherModule();
const widgets = [
  new FuelModule(),
  new HolidaysModule(),
  new AirQualityModule(),
].filter(m => m.config.enabled !== false);

let indexModule = 0;
let minuteurRetour = null;

// ───────────────────────────────────────── Swipe ─────────────────────────────────────

const pages = document.getElementById('pages');
let x0 = null, y0 = null, dx = 0, dy = 0, geste = null;

function goToDay(n) {
  weather.goToDay(n);
  reveil();
}

function reveil() {
  clearTimeout(minuteurRetour);
  if (weather.currentDay !== 0) {
    minuteurRetour = setTimeout(() => goToDay(0), CONFIG.retourAujourd);
  }
}

function snap() {
  pages.classList.add('glisse');
  pages.style.transform = 'translateX(0)';
  pages.style.opacity = '1';
}

document.addEventListener('pointerdown', e => {
  if (e.target.closest('#modules')) {
    x0 = null;
    return;
  }
  x0 = e.clientX;
  y0 = e.clientY;
  dx = 0;
  dy = 0;
  geste = null;
  pages.classList.remove('glisse');
  reveil();
});

document.addEventListener('pointermove', e => {
  if (x0 === null) return;
  dx = e.clientX - x0;
  dy = e.clientY - y0;
  if (document.body.classList.contains('fenetre-ouverte')) return;

  if (geste === null && Math.abs(dx) + Math.abs(dy) > 10) {
    geste = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
  }
  if (geste !== 'h') return;

  const mur = (dx > 0 && weather.currentDay === 0) ||
              (dx < 0 && weather.data && weather.currentDay === weather.data.length - 1);
  const d = dx * (mur ? .12 : .38);
  pages.style.transform = `translateX(${d}px)`;
  pages.style.opacity = String(Math.max(.35, 1 - Math.abs(d) / 260));
});

document.addEventListener('pointerup', () => {
  if (x0 === null) return;
  if (document.body.classList.contains('fenetre-ouverte')) {
    if (Math.abs(dx) > 40 || Math.abs(dy) > 40) fermerFenetre();
    x0 = y0 = null;
    geste = null;
    return;
  }
  if (geste === 'h' && Math.abs(dx) > 60) {
    goToDay(weather.currentDay + (dx < 0 ? 1 : -1));
  } else {
    snap();
  }
  x0 = y0 = null;
  geste = null;
});

document.addEventListener('pointercancel', () => {
  snap();
  x0 = y0 = null;
  geste = null;
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') goToDay(weather.currentDay + 1);
  if (e.key === 'ArrowLeft') goToDay(weather.currentDay - 1);
  if (e.key === 'Home') goToDay(0);
  if (e.key === 'Escape' && document.body.classList.contains('fenetre-ouverte')) fermerFenetre();
});

// ───────────────────────────────────────── Modules ─────────────────────────────────────

function modulesQualifies() {
  return widgets.filter(m => m.isReady() && m.isRelevant());
}

function peindreModules() {
  const conteneur = document.getElementById('modules');
  const corps = document.getElementById('modules-corps');
  const points = document.getElementById('modules-points');
  const qual = modulesQualifies();

  if (!qual.length) {
    conteneur.classList.remove('visible');
    return;
  }

  if (indexModule >= qual.length) indexModule = 0;
  conteneur.classList.add('visible');

  const card = qual[indexModule].renderCard();
  if (!card) {
    conteneur.classList.remove('visible');
    return;
  }

  const { label, valeur } = card;
  const empreinte = `${qual[indexModule].id}|${label}|${valeur}`;

  corps.style.opacity = '0';
  setTimeout(() => {
    const labelEl = createText('span', label, 'label');
    const valeurEl = createText('span', valeur, 'valeur');
    clearAndAppend(corps, labelEl, valeurEl);
    corps.style.opacity = '1';
  }, 220);

  if (qual.length > 1) {
    const dots = qual.map((_, i) => {
      const dot = document.createElement('span');
      if (i === indexModule) dot.classList.add('actif');
      return dot;
    });
    clearAndAppend(points, ...dots);
  }
}

// Carrousel automatique
setInterval(() => {
  const qual = modulesQualifies();
  if (qual.length < 2) return;
  indexModule = (indexModule + 1) % qual.length;
  peindreModules();
}, 7000);

document.getElementById('modules').addEventListener('click', () => {
  const qual = modulesQualifies();
  if (qual[indexModule]) qual[indexModule].open();
});

// ───────────────────────────────────────── Fenêtre ─────────────────────────────────────

function fermerFenetre() {
  document.getElementById('fenetre').classList.remove('ouverte');
  document.body.classList.remove('fenetre-ouverte');
  goToDay(0);
}

document.querySelector('#fenetre .fermer').addEventListener('click', fermerFenetre);

// ───────────────────────────────────────── Boucle ─────────────────────────────────────

function battement() {
  const n = maintenant();
  document.getElementById('horloge').textContent = fmtHM.format(n);
  if (weather.data) {
    weather.elairer(n);
    peindreModules();
  } else {
    document.getElementById('lieu').textContent = `${CONFIG.location.name} · ${fmtJour.format(n)}`;
  }
}

// ───────────────────────────────────────── Bootstrap ─────────────────────────────────────

async function init() {
  // Charger toutes les données (météo + widgets, en parallèle)
  const charges = [
    weather.load().catch(e => console.error('weather', e)),
    ...widgets.map(m => m.load().catch(e => console.error(m.id, e))),
  ];
  await Promise.all(charges);

  // Afficher météo ou panne
  if (weather.isReady()) {
    document.getElementById('panne').classList.remove('visible');
    const joursEl = document.getElementById('jours');
    const spans = weather.data.map((_, i) => {
      const span = document.createElement('span');
      if (i === weather.currentDay) span.classList.add('actif');
      return span;
    });
    clearAndAppend(joursEl, ...spans);
    weather.renderPage();
  } else {
    document.getElementById('panne').classList.add('visible');
  }

  // Démarrer les mises à jour
  battement();
  setInterval(battement, 20_000);
  setInterval(() => init(), CONFIG.rafraichir);
}

// Couleur initiale si offline
weather.elairer(maintenant());

init();
document.addEventListener('online', init);
