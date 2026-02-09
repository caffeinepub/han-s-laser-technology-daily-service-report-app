/**
 * Utility to clear persisted Internet Identity session data from browser storage.
 * This ensures a clean logout by removing AuthClient delegation and session artifacts.
 */
export function clearAuthSessionStorage(): void {
  try {
    // Clear all localStorage keys that might contain auth session data
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Remove Internet Identity and auth-client related keys
        if (
          key.includes('ic-') ||
          key.includes('identity') ||
          key.includes('delegation') ||
          key.includes('auth')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove localStorage key: ${key}`, e);
      }
    });

    // Clear sessionStorage as well
    const sessionKeysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        if (
          key.includes('ic-') ||
          key.includes('identity') ||
          key.includes('delegation') ||
          key.includes('auth')
        ) {
          sessionKeysToRemove.push(key);
        }
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove sessionStorage key: ${key}`, e);
      }
    });
  } catch (error) {
    console.error('Error clearing auth session storage:', error);
  }
}
