import { Module } from './base.js';
import { CONFIG, maintenant, fmtDateCourt } from '../config.js';
import { fetchJSON } from '../lib/fetch.js';
import { joursEntre, nomCourt } from '../lib/format.js';

export class HolidaysModule extends Module {
  constructor(config = {}) {
    super('holidays', { ...CONFIG.modules.holidays, ...config });
    if (!this.config.enabled) return;
  }

  async load() {
    if (!this.config.enabled) return;

    try {
      const p = new URLSearchParams({
        dataset: 'fr-en-calendrier-scolaire',
        q: `location:"${this.config.academie}" AND zones:"${this.config.zone}"`,
        sort: 'start_date',
        rows: 40,
      });
      const j = await fetchJSON('https://data.education.gouv.fr/api/records/1.0/search/?' + p);

      const vu = new Set();
      this.data = j.records
        .map(rec => rec.fields)
        .filter(f => f.start_date && f.end_date && /^(Vacances|Début des Vacances)/i.test(f.description || ''))
        .map(f => ({ nom: f.description, debut: new Date(f.start_date), fin: new Date(f.end_date) }))
        .filter(x => {
          const cle = x.nom + x.debut.toISOString().slice(0, 10);
          return vu.has(cle) ? false : (vu.add(cle), true);
        })
        .sort((a, b) => a.debut - b.debut);
    } catch (e) {
      console.error('holidays', e);
    }
  }

  isRelevant() {
    if (!this.data?.length) return false;
    const n = maintenant();
    if (this.data.some(p => p.debut <= n && n <= p.fin)) return true;
    const prochaine = this.data.find(p => p.debut > n);
    return !!prochaine && joursEntre(n, prochaine.debut) <= 21;
  }

  renderCard() {
    if (!this.data?.length) return null;
    const n = maintenant();
    const actuelle = this.data.find(p => p.debut <= n && n <= p.fin);
    const prochaine = this.data.find(p => p.debut > n);

    if (actuelle) {
      return {
        label: nomCourt(actuelle.nom),
        valeur: `Reprise ${fmtDateCourt.format(actuelle.fin)}`
      };
    } else if (prochaine) {
      return {
        label: nomCourt(prochaine.nom),
        valeur: `Dans ${joursEntre(n, prochaine.debut)} j`
      };
    }
    return null;
  }

  renderDetail() {
    if (!this.data?.length) return '';
    const n = maintenant();

    let html = `<h2>Vacances scolaires</h2><div class="sous">${this.config.zone} · académie de ${this.config.academie}</div>`;
    this.data.filter(p => p.fin >= n).slice(0, 5).forEach(p => {
      html += `<div class="ligne${p.debut <= n ? ' actuel' : ''}">
        <div class="principal">${nomCourt(p.nom)}</div>
        <div class="detail">${fmtDateCourt.format(p.debut)} → ${fmtDateCourt.format(p.fin)}</div>
      </div>`;
    });
    return html;
  }
}
