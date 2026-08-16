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
```

Paramètres de débogage (cumulables) — pratiques pour juger un rendu
nocturne sans attendre 23 h :

| Paramètre | Effet |
|---|---|
| `?heure=18.5` | Fige l'horloge affichée à 18 h 30 |
| `?ambiance=nuit` | Force le fond sombre constant |
| `?lum=0.3` | Force la luminosité (`off` = image intacte) |
| `?veille=10` | Ramène le délai de mise en veille à 10 s (`on` = tout de suite, `off` = désactivée) |

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

## Écran allumé 24/7

Trois comportements réglables dans `src/lib/config.ts`, pensés pour un
écran qui ne s'éteint jamais.

### Cache persistant

Chaque module écrit sa dernière réponse réseau dans `localStorage`
(`src/lib/cache.ts`, branché via `usePersistentData`). Conséquence : une
coupure réseau, ou un redémarrage du Pi pendant une coupure, n'efface plus
l'écran — le kiosque réaffiche la dernière donnée connue dès le premier
rendu, sans passer par « Pas de données météo ».

Quand la donnée affichée n'a pas pu être rafraîchie depuis
`cache.perime` (25 min par défaut), un discret `HORS LIGNE · 14:32`
apparaît sous le nom du lieu : afficher une archive sans le dire serait
pire que de ne rien afficher.

Deux garde-fous sur la péremption :

- chaque module a sa propre durée de vie maximale (`cache.*`) — un
  calendrier scolaire tient 60 jours sans réseau, une prévision météo 12 h ;
- la météo est en plus bornée au jour calendaire : une prévision dont le
  jour 0 n'est plus aujourd'hui est refusée, même récente. Le kiosque
  recharge d'ailleurs de lui-même au passage de minuit, sans attendre le
  cycle de rafraîchissement.

### Luminosité nocturne

`config.luminosite` interpole entre `jour` et `nuit` (facteurs 0–1) avec
un fondu de `transition` minutes de part et d'autre de `debutNuit` et
`finNuit`. Le calcul est dans `src/lib/luminosite.ts` ; l'application est
un voile noir plein écran (`#tamis`).

⚠️ Une page web ne peut pas piloter le rétroéclairage de la dalle : ce
réglage voile l'image, il ne baisse pas la lampe. C'est suffisant en
pratique, mais pour éteindre vraiment le rétroéclairage il faut un cron
côté Pi, indépendant de cette app :

```bash
# Dalle officielle 7" DSI (adapter le chemin selon l'écran)
echo 30 | sudo tee /sys/class/backlight/*/brightness   # nuit
echo 255 | sudo tee /sys/class/backlight/*/brightness  # jour
```

### Écran de veille

Après `veille.delai` sans interaction (4 min par défaut) et seulement
dans la plage nocturne (`veille.seulementLaNuit`), tout s'efface sauf
l'heure, à `veille.luminosite`. Un toucher réveille — et ce geste-là est
avalé au vol : réveiller l'écran ne change pas de jour et n'ouvre pas la
grande horloge. L'heure de veille dérive lentement à l'écran pour ne pas
marquer la dalle au bout de quelques mois.

## Structure

- `src/app/page.tsx` → `KioskShell` (`ssr:false`) → `KioskApp` — l'app est
  100% pilotée côté client (gestes tactiles, horloge live, couleur
  d'ambiance dépendante de l'heure), zéro besoin de SSR.
- `src/hooks/*` — couche données + interaction (un hook par module, tous
  bâtis sur `usePersistentData` + les hooks d'interaction : swipe,
  carrousel, overlays, horloge, veille, luminosité).
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
