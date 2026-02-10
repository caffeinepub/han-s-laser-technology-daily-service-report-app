import { useState, useCallback, useEffect } from 'react';

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface UseGeolocationResult {
  data: GeolocationData | null;
  status: GeolocationStatus;
  error: string | null;
  captureLocation: () => void;
  clearLocation: () => void;
}

const TIMEOUT_MS = 10000; // 10 seconds

/**
 * Hook for capturing user's current geolocation using browser Geolocation API.
 * Provides one-shot capture with configurable timeout.
 * Errors are handled silently (internal state only) for background capture scenarios.
 */
export function useGeolocation(options?: { autoCapture?: boolean }): UseGeolocationResult {
  const [data, setData] = useState<GeolocationData | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setStatus('loading');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: GeolocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setData(locationData);
        setStatus('success');
        setError(null);
      },
      (err) => {
        setStatus('error');
        setData(null);
        
        // Store error internally but don't expose user-facing messages for background capture
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permission denied');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Position unavailable');
            break;
          case err.TIMEOUT:
            setError('Timeout');
            break;
          default:
            setError('Unknown error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setData(null);
    setStatus('idle');
    setError(null);
  }, []);

  // Auto-capture on mount if requested
  useEffect(() => {
    if (options?.autoCapture) {
      captureLocation();
    }
  }, [options?.autoCapture, captureLocation]);

  return {
    data,
    status,
    error,
    captureLocation,
    clearLocation,
  };
}
