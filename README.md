# 🌦️ Kiosque Météo Modulaire

Un affichage météo élégant pour Raspberry Pi, avec système de modules extensible.

## Nouveautés (refactorisation v2)

✅ **Modularisation complète** — Plus de monolithe HTML
✅ **Architecture plugin** — Ajouter des modules en 3 étapes
✅ **5 modules inclus** — Météo, Carburant, Vacances, Qualité de l'air, VPS OVH
✅ **Séparation des concerns** — Styles, lib, modules isolés
✅ **Sécurité renforcée** — DOM methods, pas d'innerHTML brut, identifiants API jamais exposés au navigateur

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

`demarrer.sh` démarre `server.py` (fichiers statiques + proxy API OVH, voir
plus bas) sur le dossier du projet puis ouvre Chromium en mode kiosque sur
`http://localhost:8000/` (jamais sur le fichier directement). Pour un
déploiement permanent (service systemd, autologin, etc.), reprends la même
logique — server + URL `http://`, jamais un chemin `file://`.

### En dev (local)

```bash
cd kiosk
./demarrer.sh          # Linux/macOS : lance le serveur + ouvre le navigateur
demarrer.bat           # Windows : idem, en double-clic

# Ou manuellement :
python3 server.py 8000
# Visiter: http://localhost:8000
# Avec debug: http://localhost:8000?heure=18.5&ambiance=nuit
```

`server.py` remplace `python3 -m http.server` : mêmes fichiers statiques,
plus `/api/ovh-vps` pour le module OVH (voir plus bas). Sans identifiants
OVH configurés, ce endpoint répond juste "non configuré" et le module reste
invisible — aucun impact si tu n'utilises pas ce module.

## Modules

| Module | Statut | Source |
|--------|--------|--------|
| **Météo** | ✅ Inclus | Open-Meteo (gratuit) |
| **Carburant** | ✅ Inclus | DATA.gouv.fr (France) |
| **Vacances** | ✅ Inclus | DATA.education.gouv.fr |
| **Qualité air** | ✅ Inclus | Open-Meteo Air Quality |
| **VPS OVH** | ✅ Nouveau | API OVH (identifiants requis, voir plus bas) |

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

## Module OVH VPS

Affiche CPU/RAM/disque de ton VPS OVH, en jauges circulaires. Nécessite
`server.py` (pas `python -m http.server`) car les identifiants OVH ne
doivent jamais atteindre le navigateur — ils restent côté serveur, qui
signe les requêtes vers l'API OVH et ne renvoie au kiosque que les 3
pourcentages, jamais les clés.

### 1. Créer les identifiants API

1. Ouvre <https://eu.api.ovh.com/createApp/> (ou `api.us.ovhcloud.com` /
   `ca.api.ovh.com` selon ta région) et crée une application : ça te donne
   `Application Key` + `Application Secret`.
2. Génère une `Consumer Key` avec un droit `GET` sur `/vps/*` uniquement
   (pas besoin de plus) — la page de création d'app t'y redirige, ou utilise
   l'API `POST /auth/credential`.
3. Note aussi le nom exact de ton service (visible dans l'espace client OVH,
   ressemble à `xxxyyyzzz.vps.ovh.net`).

### 2. Configurer

```bash
cp .env.example .env
# Édite .env avec tes vraies valeurs (jamais commité, voir .gitignore)
```

### 3. Activer le module

Dans `config.js` :

```javascript
ovhVps: { enabled: true },
```

Relance `./demarrer.sh` (ou `demarrer.bat`) — ils chargent `.env`
automatiquement avant de démarrer `server.py`.

> ⚠️ `/vps/{serviceName}/statistics` est marqué *deprecated* côté OVH (mais
> répond toujours en 2026) — c'est la seule source qui donne CPU/RAM/disque
> en un seul appel simple ; l'alternative (`/monitoring`) est une série
> temporelle bien plus complexe pour le même résultat. Si OVH la supprime un
> jour, le module se contentera de disparaître (comme n'importe quel module
> sans données) plutôt que de planter le kiosque.

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
| `server.py` | Fichiers statiques + proxy API OVH (identifiants côté serveur) |
| `.env` / `.env.example` | Identifiants OVH (`.env` jamais commité) |
| `modules/base.js` | Interface commune |
| `modules/*.js` | Implémentations |
| `styles/*.css` | Feuilles séparées |
| `lib/*.js` | Utilitaires (color, fetch, dom, gauge) |

## Debug

URL: `http://localhost:8000?ambiance=nuit&heure=18.5`

- `?ambiance=nuit` : Force mode nuit
- `?heure=6.5` : Fige l'horloge à 6h30

Ouvrir console: F12 → Console

## Licence

MIT — Usage libre, modifications bienvenues.

---

**Questions?** Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour la doc technique complète.
