import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from './useInternetIdentity';
import { clearAuthSessionStorage } from '../utils/authSessionCleanup';
import { clearPWACaches } from '../utils/pwaCacheCleanup';

/**
 * Custom hook providing complete logout flow.
 * Supports two modes:
 * - Normal logout: clears auth and cache, reloads
 * - Reset mode: additionally clears PWA caches before reload
 */
export function useFullLogout() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const performLogout = async (options?: { isReset?: boolean }) => {
    try {
      // Clear Internet Identity session
      await clear();
      
      // Clear persisted auth/session storage
      clearAuthSessionStorage();
      
      // Clear React Query cache
      queryClient.clear();
      
      // If this is a reset operation, also clear PWA caches
      if (options?.isReset) {
        await clearPWACaches();
      }
      
      // Reload to ensure clean anonymous state
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, try to reload to clean state
      window.location.reload();
    }
  };

  return { performLogout };
}
