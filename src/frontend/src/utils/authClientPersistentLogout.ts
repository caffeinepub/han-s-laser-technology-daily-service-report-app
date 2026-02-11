import { AuthClient } from '@dfinity/auth-client';
import { loadConfig } from '../config';

/**
 * Best-effort utility to clear persisted AuthClient session state by creating
 * a fresh AuthClient instance and calling logout on it.
 * 
 * This ensures that AuthClient.isAuthenticated() returns false after page reload,
 * even if the in-memory identity reference was lost.
 * 
 * Safe and non-throwing: swallows all errors.
 */
export async function clearAuthClientPersistentSession(): Promise<void> {
  try {
    console.log('Clearing persisted AuthClient session...');
    
    // Load config to get derivation origin
    const config = await loadConfig();
    
    // Create a fresh AuthClient instance that will read from persisted storage
    const freshAuthClient = await AuthClient.create({
      idleOptions: {
        disableDefaultIdleCallback: true,
        disableIdle: true,
      },
      loginOptions: {
        derivationOrigin: config.ii_derivation_origin,
      },
    });
    
    // Call logout on the fresh instance to clear persisted state
    await freshAuthClient.logout();
    
    console.log('Persisted AuthClient session cleared successfully');
  } catch (error) {
    console.warn('Error clearing persisted AuthClient session:', error);
    // Never throw - this is best-effort cleanup
  }
}
