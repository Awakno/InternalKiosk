# Architecture modulaire du Kiosque Météo

## Structure des fichiers

```
kiosk/
├── index.html            # DOM minimal
├── config.js             # Configuration + constantes globales
├── app.js                # Bootstrap + orchestration
├── server.py             # Fichiers statiques + proxy API OVH signée
├── .env / .env.example   # Identifiants OVH (.env jamais commité)
├── meteo.html            # Ancien monolithe (deprecated)
│
├── lib/
│   ├── color.js          # OKLCH, interpolation couleurs
│   ├── format.js         # Formatters (prix, dates, AQI)
│   ├── fetch.js          # Fetch wrapper + cache
│   ├── dom.js            # Utilitaires DOM sûrs
│   ├── icons.js          # Icônes météo SVG + mapping code→condition
│   ├── ruban.js          # Graphique SVG horaire (courbe + pluie + jalons)
│   └── gauge.js          # Jauge circulaire SVG (anneau de progression %)
│
├── modules/
│   ├── base.js           # Classe Module de base
│   ├── weather.js        # Météo + ruban horaire
│   ├── fuel.js           # Prix carburants
│   ├── holidays.js       # Vacances scolaires
│   ├── airquality.js     # Qualité de l'air
│   └── ovhvps.js         # Stats VPS OVH (nouveau!) — via server.py, jamais direct
│
└── styles/
    ├── base.css          # Reset + variables
    ├── weather.css       # Écran météo
    └── modules.css       # Carrousel + fenêtres
```

## Comment ajouter un module

### 1. Créer `modules/monmodule.js`

```javascript
import { Module } from './base.js';
import { fetchJSON } from '../lib/fetch.js';

export class MonModule extends Module {
  constructor(config = {}) {
    super('monmodule', config);
  }

  async load() {
    // Récupérer les données (API, localStorage, etc.)
    this.data = await fetchJSON(url);
  }

  isRelevant() {
    // Faut-il l'afficher maintenant? (default: true)
    return true;
  }

  renderCard() {
    // Retourne { label, valeur } pour le carrousel
    return {
      label: 'Mon Label',
      valeur: 'Ma Valeur'
    };
  }

  renderDetail() {
    // Retourne du HTML pour la fenêtre plein écran
    return `<h2>Mon Module</h2><p>Détails</p>`;
  }
}
```

### 2. Ajouter à `app.js`

```javascript
import { MonModule } from './modules/monmodule.js';

const modules = [
  weather,
  new MonModule(),  // ← ajouter ici
  // ...
];
```

### 3. Optionnel: Ajouter à `config.js`

```javascript
export const CONFIG = {
  modules: {
    monmodule: { enabled: true, option1: 'valeur' },
    // ...
  }
};
```

## Interface Module

Tous les modules héritent de `base.js:Module` et implémentent:

| Méthode | Retour | Note |
|---------|--------|------|
| `load()` | Promise | Async. Initialise `this.data` |
| `isReady()` | bool | `this.data !== null` |
| `isRelevant()` | bool | Afficher maintenant? (default: true) |
| `renderCard()` | `{label, valeur}` ou null | Carrousel 7 sec |
| `renderDetail()` | string (HTML) | Fenêtre plein écran |
| `open()` | void | Ouvre la fenêtre (hérité) |

## Utilitaires

### `lib/fetch.js`
```javascript
const data = await fetchJSON(url, { ttl: 600_000, retries: 2 });
clearCache();
```

### `lib/format.js`
```javascript
fmtPrix(3.14)           // "3,14 €"
joursEntre(date1, date2)
indiceAQI(1)            // "Excellent"
emojiAQI(3)             // "😐"
```

### `lib/color.js`
```javascript
oklch(L, C, H, alpha)   // → "rgba(r,g,b,a)"
distanceKm(lat1, lon1, lat2, lon2)
lerp(a, b, t)
lerpH(a, b, t)          // Interpolation teinte (cercle)
```

### `lib/dom.js`
```javascript
createText(tag, text, className)
createDiv(children, className)
clearAndAppend(parent, ...children)
safeHTML(html)  // Pour contenu contrôlé uniquement
```

## Configuration

Édite `config.js`:

```javascript
export const CONFIG = {
  location: {
    name: "Ma Ville",
    latitude: 48.8,
    longitude: 2.3,
    timezone: "Europe/Paris"
  },
  ambiance: 'ciel',        // ou 'nuit'
  nbJours: 5,
  retourAujourd: 45 * 1000,
  rafraichir: 10 * 60 * 1000,
  modules: {
    weather: true,
    fuel: { enabled: true, type: 'sp98', rayon: 12000 },
    holidays: { enabled: true, academie: 'Versailles', zone: 'Zone C' },
    airQuality: { enabled: true },
  }
};
```

## Développement

### Lancer en local
```bash
# Python 3
python3 -m http.server 8000 --directory .

# Node http-server
npx http-server
```

Visiter: `http://localhost:8000?ambiance=nuit&heure=18.5`

### Paramètres de debug
- `?ambiance=nuit` : Force mode nuit
- `?heure=6.5` : Fige l'horloge à 6h30 (test ambiance)

## Points clés

1. **Pas de dépendances externes** (sauf Google Fonts + API publiques)
2. **Modules isolés** : chacun gère ses données et son rendu
3. **Carrousel auto** : 7 sec par module, le plus "intéressant" d'abord
4. **Swipe horizontal** : naviguer entre jours (météo seulement)
5. **Sécurité** : éviter innerHTML avec contenu utilisateur
6. **Accessibilité** : respects `prefers-reduced-motion`

## APIs utilisées

- **Météo**: [Open-Meteo](https://open-meteo.com) (gratuit, no key)
- **Qualité air**: [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api)
- **Carburant**: [DATA.gouv.fr](https://data.gouv.fr)
- **Vacances scolaires**: [DATA.education.gouv.fr](https://data.education.gouv.fr)

Toutes sans authentification requise.
