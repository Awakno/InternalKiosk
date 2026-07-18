import { Module } from './base.js';
import { CONFIG } from '../config.js';
import { fetchJSON } from '../lib/fetch.js';
import { indiceAQI, emojiAQI, disponible } from '../lib/format.js';

export class AirQualityModule extends Module {
  constructor(config = {}) {
    super('airQuality', { ...CONFIG.modules.airQuality, ...config });
    if (!this.config.enabled) return;
  }

  async load() {
    if (!this.config.enabled) return;

    try {
      const url = 'https://air-quality-api.open-meteo.com/v1/air-quality?' + new URLSearchParams({
        latitude: CONFIG.location.latitude,
        longitude: CONFIG.location.longitude,
        current: 'european_aqi',
      });

      const j = await fetchJSON(url);
      this.data = {
        aqi: j.current.european_aqi,
        time: new Date(j.current.time)
      };
    } catch (e) {
      console.error('airQuality', e);
    }
  }

  isRelevant() {
    // Toujours intéressant, sauf si l'indice lui-même est absent
    return disponible(this.data?.aqi);
  }

  renderCard() {
    if (!disponible(this.data?.aqi)) return null;
    return {
      label: 'Qualité de l\'air',
      valeur: `${emojiAQI(this.data.aqi)} ${indiceAQI(this.data.aqi)}`
    };
  }

  renderDetail() {
    if (!disponible(this.data?.aqi)) return '';

    const descriptions = {
      1: 'Excellent - pas de restrictions à prévoir',
      2: 'Bon - conditions favorables pour les activités',
      3: 'Modéré - les groupes sensibles peuvent être affectés',
      4: 'Mauvais - recommandation d\'éviter activités en plein air',
      5: 'Très mauvais - rester autant que possible à l\'intérieur'
    };

    const html = `<h2>Qualité de l'air</h2>
      <div class="sous">Indice européen AQI</div>
      <div class="ligne">
        <div class="principal">${emojiAQI(this.data.aqi)} ${indiceAQI(this.data.aqi)}</div>
        <div class="detail">Indice: ${this.data.aqi}</div>
      </div>
      <div style="margin-top: 1.5rem; font-size: 1.3rem; line-height: 1.5; color: var(--doux);">
        ${descriptions[this.data.aqi] || 'Données indisponibles'}
      </div>`;

    return html;
  }
}
