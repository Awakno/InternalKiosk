// Fetch wrapper avec cache naïf et retry

interface CacheEntry {
  data: unknown;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

export interface FetchJSONOptions extends RequestInit {
  ttl?: number;
  retries?: number;
}

export async function fetchJSON<T = unknown>(url: string, options: FetchJSONOptions = {}): Promise<T> {
  const { ttl = 600_000, retries = 2, ...fetchOpts } = options;

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
