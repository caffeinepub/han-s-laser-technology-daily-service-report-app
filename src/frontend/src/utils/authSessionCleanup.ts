/**
 * Utility to clear ALL persisted browser storage during system reset.
 * This ensures a completely fresh state by removing all localStorage and sessionStorage data.
 * Safe and best-effort: never throws errors.
 */
export function clearAuthSessionStorage(): void {
  try {
    // Clear ALL localStorage
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }

    // Clear ALL sessionStorage
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e);
    }

    console.log('Browser storage cleared successfully');
  } catch (error) {
    console.error('Error clearing browser storage:', error);
  }
}
