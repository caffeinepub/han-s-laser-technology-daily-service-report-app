/**
 * Best-effort utility to clear PWA/service worker Cache Storage entries
 * and unregister all service workers during full system reset.
 * Used during full system reset to ensure no stale cached content remains.
 * Resilient: swallows errors so reset flow can complete even in unsupported environments.
 * 
 * Note: This utility remains compatible with versioned cache names introduced
 * in the service worker (e.g., hans-laser-precache-v1, hans-laser-runtime-v1).
 */
export async function clearPWACaches(): Promise<void> {
  try {
    console.log('Starting PWA cache cleanup...');
    
    // Step 1: Clear all Cache Storage entries
    if ('caches' in window) {
      try {
        const cacheNames = await Promise.race([
          caches.keys(),
          new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 3000))
        ]);
        
        const deletionPromises = cacheNames.map(cacheName => {
          return caches.delete(cacheName).then(success => {
            if (success) {
              console.log(`Deleted cache: ${cacheName}`);
            } else {
              console.warn(`Failed to delete cache: ${cacheName}`);
            }
          }).catch(error => {
            console.warn(`Error deleting cache ${cacheName}:`, error);
          });
        });
        
        await Promise.race([
          Promise.all(deletionPromises),
          new Promise((resolve) => setTimeout(resolve, 3000))
        ]);
        
        console.log('Cache Storage cleared');
      } catch (error) {
        console.warn('Error clearing Cache Storage:', error);
      }
    } else {
      console.log('Cache Storage not supported, skipping');
    }
    
    // Step 2: Unregister all service workers
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await Promise.race([
          navigator.serviceWorker.getRegistrations(),
          new Promise<ServiceWorkerRegistration[]>((resolve) => setTimeout(() => resolve([]), 3000))
        ]);
        
        const unregisterPromises = registrations.map(registration => {
          return registration.unregister().then(success => {
            if (success) {
              console.log('Service worker unregistered:', registration.scope);
            } else {
              console.warn('Failed to unregister service worker:', registration.scope);
            }
          }).catch(error => {
            console.warn('Error unregistering service worker:', error);
          });
        });
        
        await Promise.race([
          Promise.all(unregisterPromises),
          new Promise((resolve) => setTimeout(resolve, 3000))
        ]);
        
        console.log('Service workers unregistered');
      } catch (error) {
        console.warn('Error unregistering service workers:', error);
      }
    } else {
      console.log('Service Worker not supported, skipping');
    }
    
    console.log('PWA cache cleanup completed');
  } catch (error) {
    console.error('Error during PWA cache cleanup:', error);
    // Never throw - this is best-effort cleanup
  }
}
