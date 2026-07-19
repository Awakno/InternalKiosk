# Kiosque météo — Next.js

Kiosque météo Raspberry Pi (écran tactile), migré de l'ancienne version
statique vanilla (HTML/CSS/JS) vers Next.js — l'historique de cette
migration reste consultable dans `git log`. TypeScript, App Router, aucune
dépendance UI/CSS-in-JS.

## Développement local

```bash
npm install
npm run dev
# Visiter http://localhost:3000
# Debug : http://localhost:3000?heure=18.5&ambiance=nuit
```

## Déploiement — Vercel

Le kiosque est hébergé sur Vercel : le Raspberry Pi ne fait plus tourner
aucun serveur, il ouvre juste Chromium sur l'URL Vercel. Vercel gère le
build (SWC/Turbopack) et l'exécution, aucune inquiétude sur l'architecture
ARM du Pi puisque rien ne compile ni ne tourne dessus.

Dashboard Vercel → **Add New → Project** → importer ce repo GitHub → Vercel
détecte Next.js automatiquement (framework preset, build command, etc., zéro
configuration à toucher). Aucune variable d'environnement requise.

## Côté Raspberry Pi

Le Pi n'a plus besoin de Node.js, de build, ni de serveur local — juste
Chromium en mode kiosque pointé sur l'URL Vercel :

```bash
chromium --kiosk --noerrdialogs --disable-infobars --no-first-run \
  --disable-session-crashed-bubble --password-store=basic \
  https://ton-projet.vercel.app/
```

Garde le pattern de relance en boucle déjà en place (voir le script dans
`/usr/bin/` sur le Pi) pour que Chromium redémarre s'il plante — il n'y a
plus de serveur local à superviser en plus.

## Structure

- `src/app/page.tsx` → `KioskShell` (`ssr:false`) → `KioskApp` — l'app est
  100% pilotée côté client (gestes tactiles, horloge live, couleur
  d'ambiance dépendante de l'heure), zéro besoin de SSR.
- `src/hooks/*` — couche données + interaction (un hook par module + les
  hooks d'interaction : swipe, carrousel, overlays, horloge).
- `src/components/*` — présentation (JSX pur, pas de génération de chaînes
  HTML).
- `src/lib/*` — logique pure (couleur OKLCH, formatters, fetch, config).

## Modules

| Module | Source |
|---|---|
| Météo | Open-Meteo |
| Carburant | data.economie.gouv.fr |
| Vacances scolaires | data.education.gouv.fr |
| Qualité de l'air | Open-Meteo Air Quality (désactivé par défaut) |

Pour ajouter un module : un hook `useXxx()` (voir `src/hooks/`) + des
composants `XxxCard`/`XxxDetail` (voir `src/components/modules/`), puis
l'ajouter dans `src/hooks/useModules.tsx`.
