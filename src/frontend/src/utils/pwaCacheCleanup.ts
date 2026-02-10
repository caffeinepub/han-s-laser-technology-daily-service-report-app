/**
 * Best-effort utility to clear PWA/service worker Cache Storage entries.
 * Used during full system reset to ensure no stale cached content remains.
 * Resilient: swallows errors so reset flow can complete even in unsupported environments.
 * 
 * Note: This utility remains compatible with versioned cache names introduced
 * in the service worker (e.g., hans-laser-precache-v1, hans-laser-runtime-v1).
 */
export async function clearPWACaches(): Promise<void> {
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      console.warn('Cache API not available in this environment');
      return;
    }

    // Get all cache names (including versioned caches)
    const cacheNames = await caches.keys();
    
    // Delete all caches
    const deletionPromises = cacheNames.map(cacheName => {
      return caches.delete(cacheName).catch(err => {
        console.warn(`Failed to delete cache: ${cacheName}`, err);
        return false;
      });
    });

    await Promise.all(deletionPromises);
    
    console.log('PWA caches cleared successfully');
  } catch (error) {
    // Swallow error - reset should continue even if cache cleanup fails
    console.warn('Failed to clear PWA caches (non-critical):', error);
  }
}
