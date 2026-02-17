import { clearAuthClientIndexedDB } from './authClientIndexedDbCleanup';
import { clearAuthClientPersistentSession } from './authClientPersistentLogout';

/**
 * Best-effort cleanup to prevent Internet Identity auto-authentication.
 * Safe to call multiple times; never throws.
 * 
 * Clears:
 * - AuthClient IndexedDB databases
 * - AuthClient persistent session state
 * 
 * This prevents any previously stored Internet Identity session from
 * auto-restoring when the app loads.
 */
export async function ensureNoInternetIdentityAutoAuth(): Promise<void> {
  try {
    // Clear AuthClient IndexedDB
    await clearAuthClientIndexedDB();
    
    // Clear AuthClient persistent session
    await clearAuthClientPersistentSession();
    
    console.log('Internet Identity auto-auth prevention complete');
  } catch (error) {
    // Silent failure - this is best-effort cleanup
    console.warn('Internet Identity cleanup encountered an error (non-critical):', error);
  }
}
