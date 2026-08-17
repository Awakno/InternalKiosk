"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CONFIG } from "@/lib/config";

export interface GoveeLight {
  // null tant que l'état réel n'a pas été lu une première fois.
  on: boolean | null;
  name: string | null;
  available: boolean;
  pending: boolean;
  toggle: () => void;
}

export function useGoveeLight(): GoveeLight {
  const enabled = CONFIG.actions.govee.enabled;
  const [on, setOn] = useState<boolean | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [pending, setPending] = useState(false);
  // Lu dans le .catch() de toggle() pour revenir en arrière sans que la
  // fermeture capture un état obsolète.
  const before = useRef<boolean | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/govee", { cache: "no-store" });
        if (cancelled) return;
        if (!r.ok) {
          setAvailable(false);
          return;
        }
        const data = await r.json();
        setOn(Boolean(data.on));
        setName(typeof data.name === "string" ? data.name : null);
        setAvailable(true);
      } catch {
        if (!cancelled) setAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const toggle = useCallback(() => {
    if (!available || on === null || pending) return;
    before.current = on;
    setOn(!on);
    setPending(true);
    fetch("/api/govee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ power: !on }),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
      })
      .catch(() => setOn(before.current))
      .finally(() => setPending(false));
  }, [available, on, pending]);

  return { on, name, available: enabled && available, pending, toggle };
}
