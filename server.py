#!/usr/bin/env python3
"""Serveur local du kiosque : fichiers statiques + proxy API OVH.

Remplace `python3 -m http.server` : sert les mêmes fichiers, et ajoute
GET /api/ovh-vps, qui appelle l'API OVH signée côté serveur pour récupérer
les stats du VPS. Le navigateur ne voit jamais les identifiants OVH — ils
ne quittent jamais ce process.

Identifiants (variables d'environnement, jamais commitées) :
  OVH_APP_KEY, OVH_APP_SECRET, OVH_CONSUMER_KEY, OVH_SERVICE_NAME
  OVH_ENDPOINT (optionnel, défaut "ovh-eu")

Voir README.md pour la procédure de création des identifiants.
"""

import hashlib
import http.server
import json
import os
import socketserver
import sys
import time
import urllib.error
import urllib.request

ENDPOINTS = {
    "ovh-eu": "https://eu.api.ovh.com/1.0",
    "ovh-us": "https://api.us.ovhcloud.com/1.0",
    "ovh-ca": "https://ca.api.ovh.com/1.0",
    "kimsufi-eu": "https://eu.api.kimsufi.com/1.0",
    "kimsufi-ca": "https://ca.api.kimsufi.com/1.0",
    "soyoustart-eu": "https://eu.api.soyoustart.com/1.0",
    "soyoustart-ca": "https://ca.api.soyoustart.com/1.0",
}

CACHE_TTL = 60  # secondes -- évite de marteler l'API OVH à chaque poll du kiosque
_cache = {"data": None, "expires": 0}
_time_delta = {"value": None}  # décalage horloge locale / serveur OVH, calculé une fois


def _ovh_config():
    app_key = os.environ.get("OVH_APP_KEY")
    app_secret = os.environ.get("OVH_APP_SECRET")
    consumer_key = os.environ.get("OVH_CONSUMER_KEY")
    service_name = os.environ.get("OVH_SERVICE_NAME")
    endpoint = os.environ.get("OVH_ENDPOINT", "ovh-eu")

    if not (app_key and app_secret and consumer_key and service_name):
        return None
    if endpoint not in ENDPOINTS:
        return None
    return {
        "app_key": app_key,
        "app_secret": app_secret,
        "consumer_key": consumer_key,
        "service_name": service_name,
        "base_url": ENDPOINTS[endpoint],
    }


def _server_time_delta(base_url):
    """L'API OVH refuse les requêtes signées si l'horloge locale dérive trop.
    /auth/time est public (pas de signature) et renvoie l'heure du serveur."""
    if _time_delta["value"] is not None:
        return _time_delta["value"]
    try:
        with urllib.request.urlopen(f"{base_url}/auth/time", timeout=5) as r:
            server_time = int(r.read().decode().strip())
        _time_delta["value"] = server_time - int(time.time())
    except Exception:
        _time_delta["value"] = 0
    return _time_delta["value"]


def _signed_get(cfg, path):
    url = cfg["base_url"] + path
    method = "GET"
    body = ""
    timestamp = str(int(time.time()) + _server_time_delta(cfg["base_url"]))

    to_hash = "+".join([cfg["app_secret"], cfg["consumer_key"], method, url, body, timestamp])
    signature = "$1$" + hashlib.sha1(to_hash.encode("utf-8")).hexdigest()

    req = urllib.request.Request(url, method=method, headers={
        "X-Ovh-Application": cfg["app_key"],
        "X-Ovh-Consumer": cfg["consumer_key"],
        "X-Ovh-Timestamp": timestamp,
        "X-Ovh-Signature": signature,
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read().decode("utf-8"))


def _fetch_vps_stats():
    now = time.time()
    if _cache["data"] is not None and now < _cache["expires"]:
        return _cache["data"]

    cfg = _ovh_config()
    if cfg is None:
        return {"error": "not_configured"}

    try:
        # /statistics est marqué "deprecated" côté OVH mais reste la seule
        # source qui donne cpu/mémoire/disque en un seul appel simple ; les
        # remplacements (/monitoring) sont des séries temporelles bien plus
        # complexes à consommer pour un gain nul ici. À revoir si OVH la
        # supprime effectivement (elle répond encore 401 sans erreur 404).
        stats = _signed_get(cfg, f"/vps/{cfg['service_name']}/statistics")
        vps = _signed_get(cfg, f"/vps/{cfg['service_name']}")

        result = {
            "cpu": stats.get("cpu"),
            "memory": stats.get("memory"),
            "disk": stats.get("disk"),
            "serviceName": cfg["service_name"],
            "displayName": vps.get("displayName") or vps.get("name") or cfg["service_name"],
            "state": vps.get("state"),
            "fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
        }
        _cache["data"] = result
        _cache["expires"] = now + CACHE_TTL
        return result
    except urllib.error.HTTPError as e:
        return {"error": "ovh_http_error", "status": e.code}
    except Exception as e:
        return {"error": "ovh_unreachable", "detail": str(e)}


class KioskHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/ovh-vps"):
            data = _fetch_vps_stats()
            status = 503 if "error" in data else 200
            body = json.dumps(data).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def log_message(self, fmt, *args):
        pass  # silence -- évite de polluer stdout sur le Pi


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    with socketserver.TCPServer(("127.0.0.1", port), KioskHandler) as httpd:
        print(f"Kiosque servi sur http://127.0.0.1:{port}/")
        if _ovh_config() is None:
            print("Module OVH VPS : désactivé (variables OVH_* absentes) — voir README.md")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
