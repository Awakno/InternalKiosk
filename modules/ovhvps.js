import { Module } from './base.js';
import { CONFIG } from '../config.js';
import { fetchJSON } from '../lib/fetch.js';
import { disponible } from '../lib/format.js';
import { jaugeCirculaire } from '../lib/gauge.js';

export class OvhVpsModule extends Module {
  constructor(config = {}) {
    super('ovhVps', { ...CONFIG.modules.ovhVps, ...config });
    if (!this.config.enabled) return;
  }

  async load() {
    if (!this.config.enabled) return;

    try {
      // /api/ovh-vps est servi par server.py (même origine que le kiosque) :
      // les identifiants OVH restent côté serveur, jamais dans le navigateur.
      const j = await fetchJSON('/api/ovh-vps', { ttl: 60_000 });
      if (j.error) {
        console.error('ovhVps', j.error, j.detail || j.status || '');
        return;
      }
      this.data = j;
    } catch (e) {
      console.error('ovhVps', e);
    }
  }

  isRelevant() {
    return disponible(this.data?.cpu) || disponible(this.data?.memory) || disponible(this.data?.disk);
  }

  renderCard() {
    if (!this.isRelevant()) return null;
    const parties = [
      disponible(this.data.cpu) && `CPU ${Math.round(this.data.cpu)}%`,
      disponible(this.data.memory) && `RAM ${Math.round(this.data.memory)}%`,
    ].filter(Boolean);
    return {
      label: this.data.displayName || 'VPS',
      valeur: parties.join(' · ') || '—',
    };
  }

  renderDetail() {
    if (!this.isRelevant()) return '';

    const jauges = [
      disponible(this.data.cpu) && { nom: 'CPU', valeur: this.data.cpu },
      disponible(this.data.memory) && { nom: 'RAM', valeur: this.data.memory },
      disponible(this.data.disk) && { nom: 'Disque', valeur: this.data.disk },
    ].filter(Boolean);

    const corps = jauges.map(j => `
      <div style="display:flex;flex-direction:column;align-items:center;gap:.6rem;">
        <div style="position:relative;">
          ${jaugeCirculaire(j.valeur, { taille: 110, epaisseur: 9 })}
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
                      font-variation-settings:'wdth' 110,'wght' 230;font-size:1.6rem;">
            ${Math.round(j.valeur)}%
          </div>
        </div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:1.1rem;letter-spacing:.1em;
                    text-transform:uppercase;color:var(--doux);">${j.nom}</div>
      </div>`).join('');

    return `
      <h2>${this.data.displayName || 'VPS'}</h2>
      <div class="sous">${this.data.serviceName || ''}${this.data.state ? ' · ' + this.data.state : ''}</div>
      <div style="display:flex;gap:2.4rem;justify-content:center;margin-top:1.5rem;flex-wrap:wrap;">
        ${corps}
      </div>`;
  }
}
