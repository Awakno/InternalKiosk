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
configuration à toucher). Aucune variable d'environnement requise pour le
kiosque météo lui-même — `GOVEE_API_KEY` n'est nécessaire que si le
tableau d'actions (ci-dessous) est activé.

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

## Interactions tactiles

| Geste | Effet |
|---|---|
| Balayage horizontal | Jour précédent / suivant (avec résistance aux bords) |
| Appui sur une pastille de jour | Va directement à ce jour |
| Appui sur la carte widget | Ouvre la fenêtre détail |
| Appui sur une pastille de widget | Affiche ce widget et suspend la rotation |
| Appui sur l'heure | Grand affichage plein écran |
| Balayage vertical vers le haut (ou appui sur la poignée en bas d'écran) | Ouvre le tableau d'actions |
| Balayage vers le bas dans le tableau d'actions | Le referme |
| Appui n'importe où (écran en veille) | Réveille, sans autre effet |

Sans curseur ni survol, un écran tactile n'a que l'appui pour dire qu'il a
compris : chaque cible réagit en ~90 ms, bien avant l'ouverture de la
fenêtre (300 ms). Les cibles font au moins 44 px — les pastilles restent
visuellement fines, c'est leur zone tactile qui est élargie par
pseudo-élément, pour ne pas prendre de hauteur sur 600 px d'écran.

Après une sélection au doigt dans le carrousel, la rotation automatique
s'interrompt pendant `carrousel.pauseApresTouche` (25 s) : faire glisser
la carte 7 s après qu'on l'a choisie reviendrait à annuler le geste.

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

## Tableau d'actions

Une deuxième page, séparée de l'écran météo, accessible par balayage
vertical vers le haut (ou la poignée en bas d'écran) : une grille de
grands boutons carrés, un par action. Pensée pour en accueillir d'autres
plus tard — pour l'instant, un seul bouton : allumer/éteindre une lumière
Govee.

### Pourquoi un proxy serveur

L'API Govee demande une clé (`GOVEE_API_KEY`) qui ne doit jamais atteindre
le navigateur — un `fetch` direct depuis le kiosque l'exposerait dans le
JS livré au client. `src/app/api/govee/route.ts` (route handler Next.js,
exécuté côté serveur sur Vercel) fait donc l'intermédiaire : le kiosque
n'appelle que `/api/govee`, sans jamais voir la clé. Même principe que
l'ancien proxy OVH VPS (voir `git log`), porté sur les route handlers de
l'App Router plutôt que sur un serveur Python séparé, puisqu'il y a
maintenant un vrai backend (Vercel) derrière le kiosque.

### Activer le module

L'appareil (identifiant + modèle) n'est pas à saisir : `src/lib/govee/client.ts`
le découvre lui-même via `GET /user/devices` et garde le premier éclairage
trouvé (mis en cache 10 min côté serveur). Une seule étape :

1. Dans l'app **Govee Home** : Profil → Réglages → « Apply for API Key »
   (délivrée par email, en général sous 24 h).
2. Définir `GOVEE_API_KEY` (voir `.env.example`) — en local dans `.env`
   ou `.env.local`, sur Vercel dans **Project Settings → Environment
   Variables**.

`src/lib/config.ts` n'a que `actions.govee.enabled` à éventuellement
repasser à `false` pour masquer le module sans toucher à la clé.

Comme les autres modules, le bouton se masque silencieusement plutôt que
d'afficher une action vouée à échouer : `enabled: false`, clé absente, ou
aucun appareil trouvé sur le compte → `/api/govee` répond `503
not_configured` (ou `502` si l'appel Govee échoue), et `useGoveeLight` ne
rend rien. Le libellé du bouton est le nom réel de l'appareil dans
l'app Govee Home (`deviceName`, renvoyé par `/user/devices`), pas un
texte générique.

Volontairement allumer/éteindre uniquement, pas de contrôle de couleur :
vérifié en direct que `/device/control` répond `200 success` pour
`colorRgb`/`colorTemperatureK` sans que la lumière ne change jamais
réellement de couleur, alors que `powerSwitch` et `brightness`
propagent bien -- limitation côté plateforme Govee, pas un bug d'appel
(documentée par d'autres intégrations, ex.
[wez/govee2mqtt#157](https://github.com/wez/govee2mqtt/issues/157)).

⚠️ Même en on/off, `GET /device/state` chez Govee peut mettre plusieurs
secondes à refléter une commande tout juste envoyée. `useGoveeLight` ne
se fie donc jamais à la réponse d'un `POST` pour son affichage — l'état
optimiste posé au tap fait foi tant que la requête n'échoue pas ; seul un
échec le fait revenir en arrière.

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

Le tableau d'actions suit un contrat plus simple (pas de fenêtre détail,
pas de carrousel) : un bouton = un composant dans
`src/components/actions/`, ajouté dans `src/components/kiosk/ActionsOverlay.tsx`.
