import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debounced search with rate limiting
 * 
 * @param delayMs - Delay in milliseconds to wait after user stops typing before triggering search
 * @param minLength - Minimum query length before searching
 * @param onSearch - Callback function to execute when search should be performed
 * @param rateLimiter - Optional rate limiter to check before making requests
 */
export function useDebouncedSearch<T>(
  delayMs: number = 500,
  minLength: number = 2,
  onSearch: (query: string) => Promise<T> | void,
  rateLimiter?: { canMakeRequest: () => boolean; getTimeUntilNextRequest: () => number }
) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't search if query is too short or same as last search
    if (query.trim().length < minLength) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    // Don't search if it's the same query as last time
    if (query.trim() === lastSearchRef.current) {
      return;
    }

    // Set up debounced search
    timeoutRef.current = setTimeout(() => {
      performSearch(query.trim());
    }, delayMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, delayMs, minLength, performSearch]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minLength) {
      return;
    }

    // Check rate limit one more time before making request
    if (rateLimiter && !rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getTimeUntilNextRequest();
      if (waitTime > 0) {
        // Schedule for later
        timeoutRef.current = setTimeout(() => {
          performSearch(searchQuery);
        }, waitTime);
        return;
      }
    }

    setIsSearching(true);
    setError(null);
    lastSearchRef.current = searchQuery;

    try {
      const searchResults = await onSearch(searchQuery);
      setResults(searchResults || null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Search failed');
      setError(error);
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [onSearch, minLength, rateLimiter]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
    lastSearchRef.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearSearch,
  };
}
