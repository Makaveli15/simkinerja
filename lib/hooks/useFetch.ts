'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchOptions<T> {
  initialData?: T;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
  refreshInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseFetchResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T | ((current: T | null) => T)) => void;
  refresh: () => Promise<void>;
}

// Cache for deduplication
const cache = new Map<string, { data: unknown; timestamp: number }>();
const pendingRequests = new Map<string, Promise<unknown>>();

export function useFetch<T>(
  url: string | null,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    initialData,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    dedupingInterval = 2000,
    refreshInterval,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(initialData || null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isValidating, setIsValidating] = useState(false);
  
  const mountedRef = useRef(true);
  const urlRef = useRef(url);
  urlRef.current = url;

  const fetchData = useCallback(async (isRevalidation = false) => {
    if (!urlRef.current) return;
    
    const currentUrl = urlRef.current;
    
    // Check cache
    const cached = cache.get(currentUrl);
    if (cached && Date.now() - cached.timestamp < dedupingInterval) {
      if (!isRevalidation) {
        setData(cached.data as T);
        setIsLoading(false);
      }
      return;
    }

    // Check pending request
    const pending = pendingRequests.get(currentUrl);
    if (pending) {
      try {
        const result = await pending;
        if (mountedRef.current && urlRef.current === currentUrl) {
          setData(result as T);
          setError(null);
          onSuccess?.(result as T);
        }
      } catch (err) {
        if (mountedRef.current && urlRef.current === currentUrl) {
          setError(err as Error);
          onError?.(err as Error);
        }
      }
      return;
    }

    if (isRevalidation) {
      setIsValidating(true);
    } else {
      setIsLoading(true);
    }

    const request = fetch(currentUrl)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .finally(() => {
        pendingRequests.delete(currentUrl);
      });

    pendingRequests.set(currentUrl, request);

    try {
      const result = await request;
      
      // Update cache
      cache.set(currentUrl, { data: result, timestamp: Date.now() });
      
      if (mountedRef.current && urlRef.current === currentUrl) {
        setData(result);
        setError(null);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current && urlRef.current === currentUrl) {
        setError(err as Error);
        onError?.(err as Error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, [dedupingInterval, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    
    return () => {
      mountedRef.current = false;
    };
  }, [url, fetchData]);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;
    
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleFocus);
    return () => document.removeEventListener('visibilitychange', handleFocus);
  }, [revalidateOnFocus, fetchData]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;
    
    const handleOnline = () => fetchData(true);
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, fetchData]);

  // Auto refresh
  useEffect(() => {
    if (!refreshInterval) return;
    
    const interval = setInterval(() => {
      fetchData(true);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, fetchData]);

  const mutate = useCallback((newData?: T | ((current: T | null) => T)) => {
    if (typeof newData === 'function') {
      setData((current) => (newData as (current: T | null) => T)(current));
    } else if (newData !== undefined) {
      setData(newData);
    }
    // Invalidate cache
    if (url) {
      cache.delete(url);
    }
  }, [url]);

  const refresh = useCallback(async () => {
    if (url) {
      cache.delete(url);
    }
    await fetchData();
  }, [url, fetchData]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    refresh,
  };
}

// Hook for paginated data
export function usePaginatedFetch<T>(
  baseUrl: string,
  page: number,
  pageSize: number,
  additionalParams: Record<string, string> = {}
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: pageSize.toString(),
    ...additionalParams,
  });
  
  const url = `${baseUrl}?${params.toString()}`;
  
  return useFetch<{ data: T[]; total: number; page: number; totalPages: number }>(url);
}

// Hook for debounced search
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Clear cache utility
export function clearFetchCache(url?: string) {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}
