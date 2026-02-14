/**
 * Utility to detect errors that indicate a stale or invalid authentication session.
 * These errors typically occur when the frontend thinks the user is authenticated
 * but the backend rejects the credentials.
 * 
 * Distinguishes between genuine auth errors and expected "missing profile" states.
 */

/**
 * Checks if an error indicates a missing profile for a new user.
 * This is an expected state, not an authentication failure.
 */
export function isMissingProfileError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Backend returns null for getCallerUserProfile when no profile exists
  // This is not an error condition, but we check for related error patterns
  const missingProfilePatterns = [
    'profile does not exist',
    'please complete sign up',
    'user profile not found',
    'no profile',
  ];
  
  return missingProfilePatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Checks if an error indicates pending signup/activation state.
 * This occurs when a user has signed up but their access control role
 * hasn't been fully activated yet.
 */
export function isPendingAccessError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Specific pattern for the pending access state after signup
  const pendingAccessPatterns = [
    /unauthorized.*only users can view profile/i,
    /unauthorized.*only users can access/i,
  ];
  
  return pendingAccessPatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Checks if an error indicates a genuine authentication/session failure.
 * Returns false for missing profile errors (which are expected for new users)
 * and non-auth initialization/runtime errors.
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;
  
  // First check if this is just a missing profile (not an auth error)
  if (isMissingProfileError(error)) {
    return false;
  }
  
  // Check if this is a pending access state (not an auth error)
  if (isPendingAccessError(error)) {
    return false;
  }
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Exclude non-auth initialization and runtime errors
  const nonAuthErrorPatterns = [
    'actor not available',
    'actor not initialized',
    'canister not found',
    'network error',
    'connection failed',
  ];
  
  if (nonAuthErrorPatterns.some(pattern => errorMessage.includes(pattern))) {
    return false;
  }
  
  // Check for genuine auth-related error patterns with more specific matching
  // Use word boundaries or specific phrases to avoid false positives
  const authErrorPatterns = [
    /\bnot authenticated\b/,
    /\bauthentication (failed|required|invalid)\b/,
    /\bdelegation (invalid|expired)\b/,
    /\binvalid principal\b/,
    /\bsession expired\b/,
    /\binvalid session\b/,
    /\bpermission denied\b/,
    /\bforbidden\b/,
    /\bunauthorized for caller\b/,
    /\binvalid identity\b/,
    /\bidentity (invalid|expired)\b/,
  ];
  
  return authErrorPatterns.some(pattern => pattern.test(errorMessage));
}
