/**
 * Utility to detect errors that indicate a stale or invalid authentication session.
 * These errors typically occur when the frontend thinks the user is authenticated
 * but the backend rejects the credentials.
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Check for common auth-related error patterns
  const authErrorPatterns = [
    'unauthorized',
    'forbidden',
    'authentication',
    'identity',
    'delegation',
    'invalid principal',
    'not authenticated',
    'session expired',
    'invalid session',
    'permission denied',
  ];
  
  return authErrorPatterns.some(pattern => errorMessage.includes(pattern));
}
