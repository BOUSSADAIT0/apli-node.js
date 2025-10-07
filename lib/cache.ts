// Simple in-memory cache with localStorage fallback for web
const CACHE_PREFIX = '@heures_travaille_cache:';
const CACHE_EXPIRY_MS = 1000 * 60 * 10; // 10 minutes

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry<any>>();

function getStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {}
  return null;
}

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    const fullKey = `${CACHE_PREFIX}${key}`;
    memoryCache.set(fullKey, entry);
    const storage = getStorage();
    if (storage) {
      storage.setItem(fullKey, JSON.stringify(entry));
    }
  } catch (e) {
    console.error('Cache set error:', e);
  }
}

export async function cacheGet<T>(key: string, maxAge: number = CACHE_EXPIRY_MS): Promise<T | null> {
  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    let entry = memoryCache.get(fullKey);
    if (!entry) {
      const storage = getStorage();
      if (storage) {
        const raw = storage.getItem(fullKey);
        if (raw) {
          entry = JSON.parse(raw);
          memoryCache.set(fullKey, entry);
        }
      }
    }
    if (!entry) return null;
    if (Date.now() - entry.timestamp > maxAge) {
      memoryCache.delete(fullKey);
      const storage = getStorage();
      if (storage) storage.removeItem(fullKey);
      return null;
    }
    return entry.data;
  } catch (e) {
    console.error('Cache get error:', e);
    return null;
  }
}

export async function cacheClear(key?: string): Promise<void> {
  try {
    if (key) {
      const fullKey = `${CACHE_PREFIX}${key}`;
      memoryCache.delete(fullKey);
      const storage = getStorage();
      if (storage) storage.removeItem(fullKey);
    } else {
      memoryCache.clear();
      const storage = getStorage();
      if (storage) {
        const keys = Object.keys(storage);
        keys.filter(k => k.startsWith(CACHE_PREFIX)).forEach(k => storage.removeItem(k));
      }
    }
  } catch (e) {
    console.error('Cache clear error:', e);
  }
}

