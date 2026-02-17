import { useQueryClient } from '@tanstack/react-query';
import { useLocalSessionAuth } from './useLocalSessionAuth';
import { clearAuthSessionStorage } from '../utils/authSessionCleanup';
import { clearPWACaches } from '../utils/pwaCacheCleanup';
import { clearAuthClientIndexedDB } from '../utils/authClientIndexedDbCleanup';
import { clearAuthClientPersistentSession } from '../utils/authClientPersistentLogout';

/**
 * Custom hook providing complete logout flow with comprehensive cleanup.
 * Supports two modes:
 * - Normal logout: clears auth (including IndexedDB), storage, and cache, then reloads
 * - Switch account mode: performs cleanup without reload (for LoginScreen to cleanup then start fresh login)
 * - Reset mode: additionally clears PWA caches and service workers before reload
 * 
 * Uses deterministic reload method to prevent cache restoration.
 * 
 * REGRESSION TEST VERIFICATION:
 * 1. Logout -> reload -> verify Login screen shown (no auto-login)
 * 2. Login as User A -> create report -> logout
 * 3. Login as User B -> verify User A's reports NOT visible
 * 4. Verify no stale profile/username shown during account switch
 */
export function useFullLogout() {
  const { logout } = useLocalSessionAuth();
  const queryClient = useQueryClient();

  const performLogout = async (options?: { isReset?: boolean; skipReload?: boolean }) => {
    try {
      console.log('Starting full logout cleanup...', options);
      
      // Step 1: Cancel all in-flight queries to prevent race conditions
      queryClient.cancelQueries();
      
      // Step 2: Clear React Query cache FIRST to prevent any UI flashes
      // This removes ALL cached data including principal-scoped queries
      queryClient.clear();
      
      // Step 3: Clear local session auth
      await logout();
      
      // Step 4: Clear persisted AuthClient session (creates fresh AuthClient and calls logout)
      await clearAuthClientPersistentSession();
      
      // Step 5: Clear Internet Identity IndexedDB persistence
      await clearAuthClientIndexedDB();
      
      // Step 6: Clear persisted browser storage (all localStorage/sessionStorage)
      clearAuthSessionStorage();
      
      // Step 7: If this is a reset operation, clear PWA caches and unregister service workers
      if (options?.isReset) {
        await clearPWACaches();
      }
      
      // Step 8: If skipReload is true, return without reloading (for switch account flow)
      if (options?.skipReload) {
        console.log('Logout cleanup complete (skip reload mode)');
        return;
      }
      
      // Step 9: Perform deterministic reload using replace + reload to avoid cache restoration
      console.log('Reloading to complete logout...');
      window.location.replace(window.location.origin);
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Even if there's an error, force a clean reload (unless skipReload is true)
      if (!options?.skipReload) {
        try {
          queryClient.cancelQueries();
          queryClient.clear();
          window.location.replace(window.location.origin);
        } catch (reloadError) {
          console.error('Failed to reload:', reloadError);
          // Last resort: standard reload
          window.location.reload();
        }
      }
    }
  };

  return { performLogout };
}
