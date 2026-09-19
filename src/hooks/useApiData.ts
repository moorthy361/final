// =============================================================================
// AquaSentinel AI — useApiData Hook
// =============================================================================
// Generic data-fetching hook with loading, error, and data states.
// Uses mock data fallback during development when API is unavailable.
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiDataOptions<T> {
  fetchFn: () => Promise<{ success: boolean; data: T }>;
  mockData?: T;
  autoFetch?: boolean;
  refreshInterval?: number; // ms, 0 = no auto-refresh
}

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
  isUsingMock: boolean;
}

export function useApiData<T>({
  fetchFn,
  mockData,
  autoFetch = true,
  refreshInterval = 0,
}: UseApiDataOptions<T>): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn();
      if (response.success && response.data) {
        setData(response.data);
        setIsUsingMock(false);
        setLastUpdated(new Date());
      }
    } catch {
      // If API fails, fall back to mock data during development
      if (mockData) {
        setData(mockData);
        setIsUsingMock(true);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Unable to retrieve current water-quality data. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, mockData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, fetchData]);

  return { data, loading, error, refetch: fetchData, lastUpdated, isUsingMock };
}
