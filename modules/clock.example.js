// 📝 EXEMPLE : Module Horloge
// Copie ce fichier en clock.js et ajoute à app.js pour activer.
//
// C'est un exemple minimal pour montrer comment créer un module.
// Il n'affiche que l'heure - pas d'API externe, juste du rendu.

import { Module } from './base.js';
import { CONFIG, maintenant, fmtHM } from '../config.js';

export class ClockModule extends Module {
  constructor() {
    super('clock', {});
    // Ce module n'a pas besoin de chargement asynchrone
    this.data = { time: new Date() };
  }

  async load() {
    // Pas de données à charger (on met à jour à chaque battement)
  }

  isRelevant() {
    // Toujours afficher l'horloge (sauf si vides les modules)
    return !!this.data;
  }

  renderCard() {
    // Le carrousel affiche l'heure au format simplifié
    const h = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: CONFIG.location.timezone
    });
    return {
      label: 'Horloge locale',
      valeur: h
    };
  }

  renderDetail() {
    // La fenêtre détail affiche plus d'infos
    const n = new Date();
    const fmt = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: CONFIG.location.timezone
    });

    return `
      <h2>Horloge</h2>
      <div class="sous">${CONFIG.location.timezone}</div>
      <div class="ligne">
        <div class="principal">${fmt.format(n)}</div>
      </div>
    `;
  }
}

// Pour utiliser:
// 1. Renommer en clock.js
// 2. Dans app.js, ajouter:
//    import { ClockModule } from './modules/clock.js';
//    const modules = [ weather, new ClockModule(), ... ];
