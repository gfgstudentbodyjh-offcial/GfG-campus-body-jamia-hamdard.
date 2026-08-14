/**
 * GFG Campus Body — Centralized Platform Cache & Request Deduplication Service
 *
 * Implements Stale-While-Revalidate (SWR), Request Deduplication,
 * Event Subscriptions, Blob URL Filtering, and In-Memory / LocalStorage Layering across the platform.
 */

const PREFIX = 'gfg:v3:';
const inFlightRequests = new Map();
const listeners = new Map();

// Session-only memory store for sensitive Admin data & transient state
const memoryStore = new Map();

/**
 * Validate that a URL is a persistent HTTPS/HTTP media URL.
 * Refuses ephemeral blob:, data:, and file: URLs.
 */
export function isPersistentMediaUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase().trim();
  if (lower.startsWith('blob:') || lower.startsWith('data:') || lower.startsWith('file:')) {
    return false;
  }
  return lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('/');
}

// One-time cache migration: Purge old gfg:v1:* and gfg:v2:* entries
try {
  if (typeof localStorage !== 'undefined') {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('gfg:v1:') || k.startsWith('gfg:v2:'))) {
        localStorage.removeItem(k);
      }
    }
  }
} catch (e) {}

export const cacheService = {
  /**
   * Get cached data from memory or localStorage.
   * Returns { data, isStale } or null if absent.
   */
  get(key, ttlMs = 300000) { // Default 5 minutes TTL
    const fullKey = PREFIX + key;

    // Check memory first (fastest)
    if (memoryStore.has(fullKey)) {
      const entry = memoryStore.get(fullKey);
      const isStale = Date.now() - entry.timestamp > ttlMs;
      return { data: entry.data, isStale };
    }

    // Check localStorage
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      const isStale = Date.now() - entry.timestamp > ttlMs;

      // Keep memory warm
      memoryStore.set(fullKey, entry);
      return { data: entry.data, isStale };
    } catch (e) {
      return null;
    }
  },

  /**
   * Store payload in memory & localStorage (for non-sensitive data).
   */
  set(key, data, isSensitive = false) {
    if (!key || data === undefined) return;
    const fullKey = PREFIX + key;

    // Sanitize ephemeral media URLs from object or array
    const sanitizedData = this.sanitizePayload(data);
    const entry = { data: sanitizedData, timestamp: Date.now() };

    memoryStore.set(fullKey, entry);

    if (!isSensitive) {
      try {
        localStorage.setItem(fullKey, JSON.stringify(entry));
      } catch (e) {
        this.pruneOldestLocalStorage();
      }
    }

    this.emit(key, sanitizedData);
  },

  /**
   * Recursively strip blob:/data:/file: URLs from payload before saving to cache.
   * Keeps all valid text strings (titles, descriptions, dates, categories) untouched.
   */
  sanitizePayload(item) {
    if (!item) return item;
    if (typeof item === 'string') {
      const lower = item.toLowerCase().trim();
      if (lower.startsWith('blob:') || lower.startsWith('data:') || lower.startsWith('file:')) {
        return '';
      }
      return item;
    }
    if (Array.isArray(item)) {
      return item.map(i => this.sanitizePayload(i));
    }
    if (typeof item === 'object') {
      const copy = {};
      for (const [k, v] of Object.entries(item)) {
        copy[k] = this.sanitizePayload(v);
      }
      return copy;
    }
    return item;
  },

  /**
   * Patch cached list or object in place without invalidating.
   */
  patch(key, updaterFn) {
    const cached = this.get(key, Infinity);
    if (!cached || !cached.data) return;
    const updatedData = typeof updaterFn === 'function' ? updaterFn(cached.data) : { ...cached.data, ...updaterFn };
    this.set(key, updatedData);
  },

  /**
   * Remove single cache entry or pattern.
   */
  remove(key) {
    const fullKey = PREFIX + key;
    memoryStore.delete(fullKey);
    try {
      localStorage.removeItem(fullKey);
    } catch (e) {}
    this.emit(key, null);
  },

  /**
   * Alias for remove(key)
   */
  delete(key) {
    this.remove(key);
  },

  /**
   * Invalidate all keys matching a pattern string.
   */
  invalidate(pattern) {
    const fullPattern = PREFIX + pattern;

    for (const k of memoryStore.keys()) {
      if (k.includes(pattern)) {
        memoryStore.delete(k);
      }
    }

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes(fullPattern) || k.includes(pattern))) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {}

    this.emit(pattern, null);
  },

  /**
   * In-Flight Request Deduplication.
   * Ensures 4 components requesting the same API key share 1 Promise.
   */
  dedupe(key, fetcherFn) {
    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    const promise = (async () => {
      try {
        const result = await fetcherFn();
        return result;
      } finally {
        inFlightRequests.delete(key);
      }
    })();

    inFlightRequests.set(key, promise);
    return promise;
  },

  /**
   * Lightweight Event Bus Subscriptions.
   */
  subscribe(key, callback) {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);

    return () => {
      if (listeners.has(key)) {
        listeners.get(key).delete(callback);
      }
    };
  },

  emit(key, data) {
    if (listeners.has(key)) {
      listeners.get(key).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {}
      });
    }
  },

  /**
   * Clear user-scoped private cache on logout.
   */
  clearUserCache(memberId) {
    if (!memberId) return;
    this.invalidate(`user:${memberId}`);
  },

  /**
   * Clear sensitive admin cache on admin logout.
   */
  clearAdminCache() {
    this.invalidate('admin');
  },

  /**
   * LRU cleanup if localStorage quota is reached.
   */
  pruneOldestLocalStorage() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
          keys.push(k);
        }
      }
      keys.slice(0, 5).forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }
};

export default cacheService;
