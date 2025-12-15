/**
 * Caching utility for FDC search results and food details
 * Uses localStorage for persistence
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const CACHE_PREFIX = 'fdc_cache_';
const SEARCH_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const DETAIL_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Generates cache key for search results
 */
function getSearchCacheKey(query: string): string {
  return `${CACHE_PREFIX}search_${query.toLowerCase().trim()}`;
}

/**
 * Generates cache key for food detail
 */
function getDetailCacheKey(fdcId: number): string {
  return `${CACHE_PREFIX}detail_${fdcId}`;
}

/**
 * Checks if cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  if (!entry) return false;
  const now = Date.now();
  return (now - entry.timestamp) < entry.ttl;
}

/**
 * Gets cached search results
 */
export function getCachedSearchResults<T>(query: string): T | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const key = getSearchCacheKey(query);
    const cached = window.localStorage.getItem(key);
    
    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    
    if (isCacheValid(entry)) {
      return entry.data;
    } else {
      // Expired, remove it
      window.localStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
}

/**
 * Caches search results
 */
export function cacheSearchResults<T>(query: string, data: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const key = getSearchCacheKey(query);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: SEARCH_TTL,
    };

    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn('Error writing to cache:', error);
    // If storage is full, try to clear old entries
    try {
      clearExpiredEntries();
      window.localStorage.setItem(key, JSON.stringify(entry));
    } catch (retryError) {
      // Cache is full, give up
      console.warn('Cache is full, unable to store entry');
    }
  }
}

/**
 * Gets cached food detail
 */
export function getCachedFoodDetail<T>(fdcId: number): T | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const key = getDetailCacheKey(fdcId);
    const cached = window.localStorage.getItem(key);
    
    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    
    if (isCacheValid(entry)) {
      return entry.data;
    } else {
      // Expired, remove it
      window.localStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
}

/**
 * Caches food detail
 */
export function cacheFoodDetail<T>(fdcId: number, data: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const key = getDetailCacheKey(fdcId);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: DETAIL_TTL,
    };

    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn('Error writing to cache:', error);
    // If storage is full, try to clear old entries
    try {
      clearExpiredEntries();
      window.localStorage.setItem(key, JSON.stringify(entry));
    } catch (retryError) {
      // Cache is full, give up
      console.warn('Cache is full, unable to store entry');
    }
  }
}

/**
 * Clears expired cache entries
 */
function clearExpiredEntries(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = window.localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<any> = JSON.parse(cached);
            if ((now - entry.timestamp) >= entry.ttl) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Invalid entry, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => window.localStorage.removeItem(key));
  } catch (error) {
    console.warn('Error clearing expired cache entries:', error);
  }
}

/**
 * Clears all FDC cache entries
 */
export function clearAllCache(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => window.localStorage.removeItem(key));
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
}
