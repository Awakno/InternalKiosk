#!/usr/bin/env bash
#
# install-kiosk.sh — Installe un kiosque Chromium plein écran sur Raspberry Pi OS
#                    (Bookworm / Trixie, Wayland + labwc).
#
# Ce qu'il met en place :
#   1. un utilisateur dédié "kiosk" (sans mot de passe utilisable)
#   2. l'autologin sur tty1 (aucune saisie au démarrage)
#   3. le lancement automatique de labwc à la connexion
#   4. /usr/local/bin/kiosk-launch  -> le launcher Chromium (créé par ce script)
#   5. optionnel : un mini serveur HTTP local pour servir ton dossier web
#
# Usage :
#   sudo ./install-kiosk.sh --dir ./monapp            # sert le dossier en local
#   sudo ./install-kiosk.sh --url https://exemple.fr  # pointe une URL
#   sudo ./install-kiosk.sh --dir ./monapp --rotate 90 --touch
#   sudo ./install-kiosk.sh --uninstall
#
set -euo pipefail

# ─────────────────────────── Valeurs par défaut ───────────────────────────
KIOSK_USER="kiosk"
KIOSK_HOME="/home/${KIOSK_USER}"
WWW_ROOT="/opt/kiosk/www"
HTTP_PORT="8080"
LAUNCHER="/usr/local/bin/kiosk-launch"

SRC_DIR=""
TARGET_URL=""
ROTATE="normal"
TOUCH=0
UNINSTALL=0

# ─────────────────────────────── Helpers ──────────────────────────────────
log()  { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m /!\\\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mERREUR:\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,19p' "$0" | grep '^#' | sed 's/^# \{0,1\}//'
  exit 0
}

# ────────────────────────────── Arguments ─────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)       SRC_DIR="$2"; shift 2 ;;
    --url)       TARGET_URL="$2"; shift 2 ;;
    --user)      KIOSK_USER="$2"; KIOSK_HOME="/home/$2"; shift 2 ;;
    --port)      HTTP_PORT="$2"; shift 2 ;;
    --rotate)    ROTATE="$2"; shift 2 ;;
    --touch)     TOUCH=1; shift ;;
    --uninstall) UNINSTALL=1; shift ;;
    -h|--help)   usage ;;
    *)           die "Option inconnue : $1 (voir --help)" ;;
  esac
done

[[ $EUID -eq 0 ]] || die "À lancer en root : sudo $0 ..."

# ──────────────────────────── Désinstallation ─────────────────────────────
if [[ $UNINSTALL -eq 1 ]]; then
  log "Désinstallation…"
  systemctl disable --now kiosk-web.service 2>/dev/null || true
  rm -f /etc/systemd/system/kiosk-web.service
  rm -rf /etc/systemd/system/getty@tty1.service.d/kiosk-autologin.conf
  rmdir /etc/systemd/system/getty@tty1.service.d 2>/dev/null || true
  rm -f "$LAUNCHER"
  rm -rf "${KIOSK_HOME}/.config/labwc"
  rm -f "${KIOSK_HOME}/.bash_profile"
  systemctl daemon-reload
  log "Fait. L'utilisateur ${KIOSK_USER} et ${WWW_ROOT} sont conservés."
  log "Pour tout purger : sudo userdel -r ${KIOSK_USER} && sudo rm -rf /opt/kiosk"
  exit 0
fi

# ──────────────────────────── Validation ──────────────────────────────────
[[ -n "$SRC_DIR" || -n "$TARGET_URL" ]] || die "Il faut --dir <dossier> ou --url <url>."
[[ -n "$SRC_DIR" && -n "$TARGET_URL" ]] && die "--dir et --url sont exclusifs."

case "$ROTATE" in
  normal|90|180|270) ;;
  *) die "--rotate accepte : normal, 90, 180, 270" ;;
esac

if [[ -n "$SRC_DIR" ]]; then
  [[ -d "$SRC_DIR" ]] || die "Dossier introuvable : $SRC_DIR"
  [[ -f "${SRC_DIR}/index.html" ]] || warn "Pas d'index.html dans ${SRC_DIR} — Chromium affichera la liste des fichiers."
  TARGET_URL="http://127.0.0.1:${HTTP_PORT}/"
fi

# ─────────────────────────────── Paquets ──────────────────────────────────
log "Installation des paquets…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
PKGS=(labwc seatd xwayland fonts-liberation wlr-randr)
if ! command -v chromium >/dev/null && ! command -v chromium-browser >/dev/null; then
  PKGS+=(chromium-browser)
fi
[[ -n "$SRC_DIR" ]] && PKGS+=(python3)
apt-get install -y --no-install-recommends "${PKGS[@]}"

# Nom du binaire Chromium (varie selon les images)
if command -v chromium >/dev/null; then
  CHROMIUM_BIN="$(command -v chromium)"
else
  CHROMIUM_BIN="$(command -v chromium-browser)" || die "Chromium introuvable."
fi
log "Chromium : ${CHROMIUM_BIN}"

# ───────────────────────── Utilisateur kiosk ──────────────────────────────
if id "$KIOSK_USER" &>/dev/null; then
  log "Utilisateur ${KIOSK_USER} déjà présent."
else
  log "Création de l'utilisateur ${KIOSK_USER}…"
  useradd -m -s /bin/bash "$KIOSK_USER"
  passwd -l "$KIOSK_USER"        # aucun login par mot de passe possible
fi
usermod -aG video,input,render,tty,audio "$KIOSK_USER"
systemctl enable --now seatd 2>/dev/null || true
usermod -aG _seatd "$KIOSK_USER" 2>/dev/null || true

# ─────────────────── Serveur HTTP local (si --dir) ────────────────────────
if [[ -n "$SRC_DIR" ]]; then
  log "Copie de l'app vers ${WWW_ROOT}…"
  mkdir -p "$WWW_ROOT"
  rm -rf "${WWW_ROOT:?}/"*
  cp -r "${SRC_DIR%/}/." "$WWW_ROOT/"
  chown -R root:root "$WWW_ROOT"
  chmod -R a+rX "$WWW_ROOT"

  log "Création de kiosk-web.service (port ${HTTP_PORT})…"
  cat > /etc/systemd/system/kiosk-web.service <<EOF
[Unit]
Description=Serveur statique du kiosque
After=network.target

[Service]
ExecStart=/usr/bin/python3 -m http.server ${HTTP_PORT} --bind 127.0.0.1 --directory ${WWW_ROOT}
Restart=always
RestartSec=2
User=nobody
Group=nogroup

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable --now kiosk-web.service
fi

# ─────────────────────────── Le launcher ──────────────────────────────────
log "Création du launcher ${LAUNCHER}…"

EXTRA_FLAGS=""
if [[ $TOUCH -eq 1 ]]; then
  EXTRA_FLAGS='--touch-events=enabled --disable-pinch --overscroll-history-navigation=0'
fi

cat > "$LAUNCHER" <<EOF
#!/usr/bin/env bash
# Généré par install-kiosk.sh — relance Chromium en boucle si le navigateur meurt.
set -u

URL="\${KIOSK_URL:-${TARGET_URL}}"
ROTATE="${ROTATE}"
PROFILE="\${HOME}/.config/chromium"

# Rotation de l'écran (premier écran détecté)
if [[ "\$ROTATE" != "normal" ]] && command -v wlr-randr >/dev/null; then
  OUT="\$(wlr-randr 2>/dev/null | awk '/^[^ ]/ {print \$1; exit}')"
  [[ -n "\$OUT" ]] && wlr-randr --output "\$OUT" --transform "\$ROTATE" || true
fi

while true; do
  # Efface le drapeau de crash : évite le bandeau "Restore pages?" après coupure
  if [[ -f "\${PROFILE}/Default/Preferences" ]]; then
    sed -i 's/"exit_type":"[^"]*"/"exit_type":"Normal"/; s/"exited_cleanly":false/"exited_cleanly":true/' \\
      "\${PROFILE}/Default/Preferences" || true
  fi

  ${CHROMIUM_BIN} "\$URL" \\
    --kiosk \\
    --ozone-platform=wayland \\
    --noerrdialogs \\
    --disable-infobars \\
    --no-first-run \\
    --disable-session-crashed-bubble \\
    --disable-restore-session-state \\
    --disable-features=Translate,TranslateUI \\
    --password-store=basic \\
    --check-for-update-interval=31536000 \\
    --autoplay-policy=no-user-gesture-required \\
    ${EXTRA_FLAGS} \\
    --user-data-dir="\$PROFILE"

  echo "[kiosk] Chromium s'est arrêté, relance dans 3 s…" >&2
  sleep 3
done
EOF
chmod 755 "$LAUNCHER"

# ───────────────────── Session labwc de l'utilisateur ─────────────────────
log "Configuration de la session labwc…"
install -d -o "$KIOSK_USER" -g "$KIOSK_USER" "${KIOSK_HOME}/.config/labwc"

cat > "${KIOSK_HOME}/.config/labwc/autostart" <<EOF
# Généré par install-kiosk.sh
${LAUNCHER} &
EOF

# rc.xml minimal : pas de raccourcis pour sortir, pas de décorations
cat > "${KIOSK_HOME}/.config/labwc/rc.xml" <<'EOF'
<?xml version="1.0"?>
<labwc_config>
  <theme>
    <cornerRadius>0</cornerRadius>
  </theme>
  <windowRules>
    <windowRule identifier="chromium*">
      <serverDecoration>no</serverDecoration>
      <skipTaskbar>yes</skipTaskbar>
    </windowRule>
  </windowRules>
  <!-- Aucun keybind : Alt+Tab, Alt+F4 et le menu sont désactivés -->
  <keyboard></keyboard>
</labwc_config>
EOF

chown -R "$KIOSK_USER":"$KIOSK_USER" "${KIOSK_HOME}/.config"

# Lance labwc uniquement sur tty1, à la connexion
cat > "${KIOSK_HOME}/.bash_profile" <<'EOF'
# Généré par install-kiosk.sh
if [ -z "${WAYLAND_DISPLAY:-}" ] && [ "${XDG_VTNR:-}" = "1" ]; then
  export XDG_RUNTIME_DIR="/run/user/$(id -u)"
  exec labwc > "$HOME/kiosk.log" 2>&1
fi
EOF
chown "$KIOSK_USER":"$KIOSK_USER" "${KIOSK_HOME}/.bash_profile"

# ──────────────────────── Autologin sans mot de passe ─────────────────────
log "Activation de l'autologin sur tty1…"
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/kiosk-autologin.conf <<EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin ${KIOSK_USER} --noclear %I \$TERM
EOF

# Démarrage en console (pas de gestionnaire de connexion graphique)
systemctl set-default multi-user.target
systemctl daemon-reload

# Empêche le blanking de la console texte pendant le boot
if [[ -f /boot/firmware/cmdline.txt ]] && ! grep -q consoleblank /boot/firmware/cmdline.txt; then
  sed -i '1 s/$/ consoleblank=0/' /boot/firmware/cmdline.txt
fi

# ────────────────────────────── Résumé ────────────────────────────────────
log "Installation terminée."
cat <<EOF

  Utilisateur   : ${KIOSK_USER} (autologin tty1, mot de passe verrouillé)
  URL affichée  : ${TARGET_URL}
  Launcher      : ${LAUNCHER}
  Autostart     : ${KIOSK_HOME}/.config/labwc/autostart
  Logs session  : ${KIOSK_HOME}/kiosk.log
$( [[ -n "$SRC_DIR" ]] && echo "  Contenu web   : ${WWW_ROOT}  (service kiosk-web.service)" )

  Tester sans redémarrer :  sudo systemctl restart getty@tty1
  Redémarrer            :  sudo reboot
  Désinstaller          :  sudo $0 --uninstall

EOF