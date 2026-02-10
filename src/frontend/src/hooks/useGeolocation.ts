import { useState, useCallback } from 'react';

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
 * Provides one-shot capture with configurable timeout and user-friendly error messages.
 */
export function useGeolocation(): UseGeolocationResult {
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
        
        // Provide user-friendly error messages
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access was denied. Please enable location permissions in your browser settings to attach location to reports.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please check your device settings and try again.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An error occurred while retrieving your location. Please try again.');
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

  return {
    data,
    status,
    error,
    captureLocation,
    clearLocation,
  };
}
