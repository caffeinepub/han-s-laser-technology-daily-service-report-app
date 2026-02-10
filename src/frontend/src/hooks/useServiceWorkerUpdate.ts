import { useState, useEffect, useCallback } from 'react';
import { BUILD_VERSION } from '../utils/buildInfo';

interface ServiceWorkerUpdateState {
  updateAvailable: boolean;
  applyUpdate: () => void;
  isApplyingUpdate: boolean;
}

/**
 * Hook to manage service worker updates with user-controlled activation.
 * Detects when a new service worker version is available and provides
 * an explicit action to activate it and reload the page.
 * 
 * The service worker is registered with a versioned URL (?v=BUILD_VERSION)
 * to ensure the browser fetches a fresh SW script on each build.
 */
export function useServiceWorkerUpdate(): ServiceWorkerUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  useEffect(() => {
    // Only run in production and if service workers are supported
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker with versioned URL to bust browser cache
    // This ensures a new build triggers a fresh SW fetch
    const swUrl = `/sw.js?v=${BUILD_VERSION}`;
    
    navigator.serviceWorker
      .register(swUrl, {
        // Request fresh SW checks to reduce stale SW scripts
        updateViaCache: 'none' as any,
      })
      .then((registration) => {
        // Check for updates periodically (every 60 seconds)
        const checkForUpdates = () => {
          registration.update().catch((err) => {
            console.warn('Service worker update check failed:', err);
          });
        };

        const updateInterval = setInterval(checkForUpdates, 60000);

        // Check for waiting worker on initial registration
        if (registration.waiting) {
          console.log('Service worker update available (waiting worker found on registration)');
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        // Listen for new service worker installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          console.log('Service worker update found, installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is waiting to activate
              console.log('Service worker update installed and waiting');
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });

        // Listen for controller change (new SW took control)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service worker controller changed, reloading page...');
          // Reload to get the new version
          window.location.reload();
        });

        return () => {
          clearInterval(updateInterval);
        };
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) {
      console.warn('No waiting worker available to apply update');
      return;
    }

    console.log('Applying service worker update...');
    setIsApplyingUpdate(true);

    // Send message to waiting worker to skip waiting and activate
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    
    // The controllerchange event will trigger a reload
  }, [waitingWorker]);

  return {
    updateAvailable,
    applyUpdate,
    isApplyingUpdate,
  };
}
