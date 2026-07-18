#!/usr/bin/env bash
# Lance un serveur local et ouvre le kiosque dans le navigateur.
# Necessaire : les navigateurs bloquent les modules JavaScript (import/export)
# quand la page est ouverte directement en file://, avec une erreur qui
# ressemble a du CORS dans la console. Il faut toujours passer par http://.

set -e
cd "$(dirname "$0")"

PORT=8000
URL="http://localhost:${PORT}/"

# --bind 127.0.0.1 : usage local uniquement, pas exposé au reste du réseau.
# mktemp : un chemin de log prévisible dans /tmp serait attaquable par lien
# symbolique sur une machine multi-utilisateurs.
LOG_FILE="$(mktemp -t kiosk-server.XXXXXX.log)"

python3 -m http.server "$PORT" --bind 127.0.0.1 >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null; rm -f "$LOG_FILE"' EXIT

sleep 1

if command -v chromium-browser >/dev/null 2>&1; then
  chromium-browser --kiosk "$URL" &
elif command -v chromium >/dev/null 2>&1; then
  chromium --kiosk "$URL" &
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" &
else
  echo "Serveur lancé sur ${URL} — ouvre cette adresse dans un navigateur."
fi

wait "$SERVER_PID"
