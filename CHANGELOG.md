# Changelog

## v2.0.0 - Refactorisation modulaire (2026-01-18)

### 🎯 Major Changes

- ✨ **Architecture modulaire** — Remplace le monolithe `meteo.html`
  - Classes `Module` pour chaque widget
  - Interface commune: `load()`, `isReady()`, `renderCard()`, `renderDetail()`
  - Facile d'ajouter de nouveaux modules (voir `modules/clock.example.js`)

- 📦 **Séparation des concerns**
  - `index.html` — DOM seul
  - `app.js` — Bootstrap + orchestration
  - `config.js` — Configuration centralisée
  - `lib/` — Utilitaires réutilisables (color, format, fetch, dom)
  - `modules/` — Chaque widget isolé
  - `styles/` — CSS séparé par domaine

- 🔒 **Sécurité renforcée**
  - Évite `innerHTML` avec contenu non sûr
  - Utilitaires DOM dans `lib/dom.js`
  - Validation des entrées APIs

- 🆕 **Nouveau module : Qualité de l'air**
  - Indice AQI européen (Open-Meteo)
  - Descriptions contextuelles (1-5 niveaux)
  - Emoji pour une lecture rapide

### 📋 Details

#### Modules

| Module | Statut | Chemin |
|--------|--------|--------|
| Météo | ✅ Refactorisé | `modules/weather.js` |
| Carburant | ✅ Refactorisé | `modules/fuel.js` |
| Vacances scolaires | ✅ Refactorisé | `modules/holidays.js` |
| Qualité air | ✨ **Nouveau** | `modules/airquality.js` |

#### Utilitaires

- `lib/color.js` — OKLCH color, interpolation, distance
- `lib/format.js` — Formatage prix, dates, indices
- `lib/fetch.js` — Wrapper fetch avec cache + retry
- `lib/dom.js` — Création élements sûre (pas innerHTML brut)

#### Styles

- `styles/base.css` — Reset + variables (avant)
- `styles/weather.css` — Écran météo principal
- `styles/modules.css` — Carrousel + fenêtres détail

#### Config

- `config.js` — Unique source of truth
  - Location (lat/lon/timezone)
  - Modules on/off
  - Timeouts + refresh rates
  - Debug args (`?heure=`, `?ambiance=`)

### 🗑️ Deprecated

- `meteo.html` — Remplacé par architecture modulaire
- `installer.sh` — Non maintenu (configuration manuelle recommandée)

### 📚 Documentation

- `README.md` — Guide utilisateur
- `ARCHITECTURE.md` — Spécifications techniques
- `modules/clock.example.js` — Template pour nouveaux modules

### 🧪 Testing

```bash
# Développement local
python3 -m http.server 8000

# Debug URLs
http://localhost:8000?ambiance=nuit        # Mode nuit
http://localhost:8000?heure=18.5           # Fige horloge
http://localhost:8000?heure=6.5&ambiance=nuit  # Combiné
```

### ⚡ Performance

- ✅ Pas de dépendances npm
- ✅ Modules ES6 (load async)
- ✅ Cache API (10 min par défaut)
- ✅ Lazy loading modules
- ✅ Animation GPU (transform, opacity)

### 🔄 Migration depuis v1

Si vous aviez une config perso dans `meteo.html`:

1. Éditer `config.js` pour votre location
2. Activer/désactiver modules dans `CONFIG.modules`
3. Supprimer `meteo.html`
4. Visiter `index.html` à la place

### 🎓 Pour développeurs

Créer un module (`modules/mymodule.js`):

```javascript
import { Module } from './base.js';

export class MyModule extends Module {
  constructor(config = {}) {
    super('mymodule', config);
  }

  async load() {
    this.data = await fetchJSON(url);
  }

  isRelevant() { return !!this.data; }
  renderCard() { return { label: '...', valeur: '...' }; }
  renderDetail() { return '<h2>...</h2>'; }
}
```

Puis dans `app.js`:

```javascript
import { MyModule } from './modules/mymodule.js';
const modules = [ ..., new MyModule() ];
```

### 🐛 Fixes

- Amélioration sécurité DOM
- Meilleure gestion erreurs async
- Respect `prefers-reduced-motion`

---

## v1.0.0 - Initial (2026-01-10)

- Kiosque météo monolithe `meteo.html`
- Modules: météo, carburant, vacances
- Affichage élégant pour écran 1024×600
