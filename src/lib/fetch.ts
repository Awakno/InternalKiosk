// Fetch wrapper avec cache naïf et retry
//
// Ce cache-ci est un simple dédoublonnage à l'échelle de l'onglet : il
// disparaît au rechargement. La persistance entre redémarrages est assurée
// par lib/cache.ts, en amont dans usePersistentData.

interface CacheEntry {
  data: unknown;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

export interface FetchJSONOptions extends RequestInit {
  ttl?: number;
  retries?: number;
}

// Doit rester nettement sous CONFIG.rafraichir : à durée égale (l'ancienne
// valeur, 10 min, était exactement celle de la cadence), un rafraîchissement
// programmé tombe à la frontière de l'expiration et se fait resservir
// l'entrée périmée une fois sur deux -- le module sautait alors un cycle
// entier sans jamais toucher le réseau.
const TTL_DEDOUBLONNAGE = 30_000;

export async function fetchJSON<T = unknown>(url: string, options: FetchJSONOptions = {}): Promise<T> {
  const { ttl = TTL_DEDOUBLONNAGE, retries = 2, ...fetchOpts } = options;

  // Vérifier cache
  const cached = cache.get(url);
  if (cached) {
    if (Date.now() < cached.expires) return cached.data as T;
    cache.delete(url);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const r = await fetch(url, { cache: "no-store", ...fetchOpts });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as T;
      cache.set(url, { data, expires: Date.now() + ttl });
      return data;
    } catch (e) {
      lastError = e;
      if (attempt < retries - 1) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export function clearCache(): void {
  cache.clear();
}
