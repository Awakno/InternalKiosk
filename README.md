# 🌦️ Kiosque Météo Modulaire

Un affichage météo élégant pour Raspberry Pi, avec système de modules extensible.

## Nouveautés (refactorisation v2)

✅ **Modularisation complète** — Plus de monolithe HTML
✅ **Architecture plugin** — Ajouter des modules en 3 étapes
✅ **4 modules inclus** — Météo, Carburant, Vacances, Qualité de l'air
✅ **Séparation des concerns** — Styles, lib, modules isolés
✅ **Sécurité renforcée** — DOM methods, pas d'innerHTML brut

## Installation

> ⚠️ **Ne jamais ouvrir `index.html` en double-clic (`file://...`).** L'app
> utilise des modules JavaScript (`import`/`export`), que les navigateurs
> bloquent quand la page n'est pas servie via `http://` — l'erreur dans la
> console ressemble à du CORS, mais ce n'en est pas : elle vient uniquement
> du protocole `file://`. Utilise toujours un serveur local (voir plus bas).

### Sur Raspberry Pi OS (Bookworm+)

```bash
cd /opt/kiosk
git clone https://github.com/toi/kiosk .

# Lance le serveur local + Chromium en kiosque, pointés sur http://
./demarrer.sh
```

`demarrer.sh` démarre `python3 -m http.server` sur le dossier du projet puis
ouvre Chromium en mode kiosque sur `http://localhost:8000/` (jamais sur le
fichier directement). Pour un déploiement permanent (service systemd,
autologin, etc.), reprends la même logique — server + URL `http://`, jamais
un chemin `file://`.

### En dev (local)

```bash
cd kiosk
./demarrer.sh          # Linux/macOS : lance le serveur + ouvre le navigateur
demarrer.bat           # Windows : idem, en double-clic

# Ou manuellement :
python3 -m http.server 8000
# Visiter: http://localhost:8000
# Avec debug: http://localhost:8000?heure=18.5&ambiance=nuit
```

## Modules

| Module | Statut | Source |
|--------|--------|--------|
| **Météo** | ✅ Inclus | Open-Meteo (gratuit) |
| **Carburant** | ✅ Inclus | DATA.gouv.fr (France) |
| **Vacances** | ✅ Inclus | DATA.education.gouv.fr |
| **Qualité air** | ✅ Nouveau | Open-Meteo Air Quality |

## Ajouter un module

Voir [ARCHITECTURE.md](./ARCHITECTURE.md#comment-ajouter-un-module).

Exemple: créer `modules/bitcoin.js`

```javascript
import { Module } from './base.js';

export class BitcoinModule extends Module {
  constructor() {
    super('bitcoin', {});
  }

  async load() {
    const r = await fetch('https://api.coindesk.com/v1/bpi/currentprice/EUR.json');
    const d = await r.json();
    this.data = d.bpi.EUR.rate;
  }

  renderCard() {
    return { label: 'Bitcoin', valeur: `€ ${this.data}` };
  }

  renderDetail() {
    return `<h2>Bitcoin</h2><div class="ligne"><div class="principal">Prix EUR</div><div class="detail">€${this.data}</div></div>`;
  }
}
```

Puis ajouter à `app.js`, dans le tableau `widgets` (le carrousel latéral —
la météo, elle, pilote l'écran principal directement et n'y figure pas) :

```javascript
import { BitcoinModule } from './modules/bitcoin.js';

const widgets = [
  // ...
  new BitcoinModule(),
];
```

## Configuration

Éditer `config.js`:

```javascript
export const CONFIG = {
  location: {
    name: "Vaugrigneuse",
    latitude: 48.6244,
    longitude: 2.1195,
    timezone: "Europe/Paris"
  },
  ambiance: 'ciel',  // ou 'nuit'
  modules: {
    weather: true,
    fuel: { enabled: true, type: 'sp98', rayon: 12000 },
    // ...
  }
};
```

## Gestures

- **Swipe gauche/droite** → Jour précédent/suivant
- **Clic module** → Ouvre détails
- **Swipe fenêtre** → Ferme
- **Keyboard** → Arrow Left/Right, Home, Escape

## Fichiers importants

| Fichier | Rôle |
|---------|------|
| `index.html` | DOM minimal |
| `app.js` | Bootstrap + orchestration |
| `config.js` | Configuration globale |
| `modules/base.js` | Interface commune |
| `modules/*.js` | Implémentations |
| `styles/*.css` | Feuilles séparées |
| `lib/*.js` | Utilitaires (color, fetch, dom) |

## Debug

URL: `http://localhost:8000?ambiance=nuit&heure=18.5`

- `?ambiance=nuit` : Force mode nuit
- `?heure=6.5` : Fige l'horloge à 6h30

Ouvrir console: F12 → Console

## Licence

MIT — Usage libre, modifications bienvenues.

---

**Questions?** Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour la doc technique complète.
