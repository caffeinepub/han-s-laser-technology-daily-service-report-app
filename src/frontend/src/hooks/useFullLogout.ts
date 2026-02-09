import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthSessionStorage } from '../utils/authSessionCleanup';

/**
 * Hook that provides a complete logout flow:
 * 1. Clears Internet Identity session via useInternetIdentity().clear()
 * 2. Clears all persisted auth session data from browser storage
 * 3. Clears all React Query cached application data
 * 4. Reloads the page to ensure a clean anonymous state
 */
export function useFullLogout() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const fullLogout = async () => {
    try {
      // Step 1: Clear Internet Identity session
      await clear();
      
      // Step 2: Clear persisted auth session storage
      clearAuthSessionStorage();
      
      // Step 3: Clear all cached application data
      queryClient.clear();
      
      // Step 4: Reload to ensure clean state
      // Small delay to ensure cleanup completes
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error during full logout:', error);
      // Even if there's an error, try to clean up and reload
      clearAuthSessionStorage();
      queryClient.clear();
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  return { fullLogout };
}
