import { Module } from './base.js';
import { CONFIG } from '../config.js';
import { fetchJSON } from '../lib/fetch.js';
import { fmtPrix, distanceKm } from '../lib/color.js';
import { fmtPrix as fmt } from '../lib/format.js';

export class FuelModule extends Module {
  constructor(config = {}) {
    super('fuel', { ...CONFIG.modules.fuel, ...config });
    if (!this.config.enabled) return;
  }

  async load() {
    if (!this.config.enabled) return;

    try {
      const p = new URLSearchParams({
        dataset: 'prix-des-carburants-en-france-flux-instantane-v2',
        'geofilter.distance': `${CONFIG.location.latitude},${CONFIG.location.longitude},${this.config.rayon}`,
        rows: 25,
      });
      const j = await fetchJSON('https://data.economie.gouv.fr/api/records/1.0/search/?' + p);
      const type = this.config.type;

      this.data = j.records
        .map(rec => rec.fields)
        .filter(f => f[`${type}_prix`] != null)
        .map(f => ({
          adresse: f.adresse,
          ville: f.ville,
          prix: f[`${type}_prix`],
          distance: f.geom ? distanceKm(CONFIG.location.latitude, CONFIG.location.longitude, f.geom[0], f.geom[1]) : null,
        }))
        .sort((a, b) => a.prix - b.prix);
    } catch (e) {
      console.error('fuel', e);
    }
  }

  renderCard() {
    if (!this.data?.length) return null;
    return {
      label: `Carburant · ${this.config.type}`,
      valeur: fmt(this.data[0].prix)
    };
  }

  renderDetail() {
    if (!this.data?.length) return '';

    let html = `<h2>Carburants</h2><div class="sous">${this.config.type} · ${CONFIG.location.name}</div>`;
    this.data.slice(0, 6).forEach((s, i) => {
      const distStr = s.distance != null ? ` · ${s.distance.toFixed(1)} km` : '';
      html += `<div class="ligne${i === 0 ? ' actuel' : ''}">
        <div class="principal">${s.adresse}, ${s.ville}</div>
        <div class="detail">${fmt(s.prix)}${distStr}</div>
      </div>`;
    });
    return html;
  }
}
