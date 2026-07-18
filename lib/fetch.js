// Fetch wrapper avec cache naïf et retry

const cache = new Map();

export async function fetchJSON(url, options = {}) {
  const { ttl = 600_000, retries = 2, ...fetchOpts } = options;

  // Vérifier cache
  if (cache.has(url)) {
    const { data, expires } = cache.get(url);
    if (Date.now() < expires) return data;
    cache.delete(url);
  }

  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const r = await fetch(url, { cache: 'no-store', ...fetchOpts });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      cache.set(url, { data, expires: Date.now() + ttl });
      return data;
    } catch (e) {
      lastError = e;
      if (attempt < retries - 1) await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export function clearCache() {
  cache.clear();
}
