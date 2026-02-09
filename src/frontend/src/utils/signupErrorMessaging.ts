import { isAuthError, isMissingProfileError } from './authErrorDetection';

/**
 * Extracts a human-readable error message from backend failures,
 * sanitizing internal implementation details while preserving actionable information.
 */
function extractBackendMessage(error: any): string | null {
  if (!error) return null;
  
  const errorMessage = error?.message || String(error);
  
  // Common backend trap/reject patterns
  const trapPatterns = [
    /Unauthorized:\s*(.+?)(?:\n|$)/i,
    /Profile already exists[.:]\s*(.+?)(?:\n|$)/i,
    /User profile[^:]*:\s*(.+?)(?:\n|$)/i,
    /Anonymous users[^:]*:\s*(.+?)(?:\n|$)/i,
    /Cannot[^:]*:\s*(.+?)(?:\n|$)/i,
    /Only admins[^:]*:\s*(.+?)(?:\n|$)/i,
    /Admin signup failed:\s*(.+?)(?:\n|$)/i,
  ];
  
  for (const pattern of trapPatterns) {
    const match = errorMessage.match(pattern);
    if (match && match[1]) {
      // Return the captured human-readable reason, sanitized
      return sanitizeBackendMessage(match[1].trim());
    }
  }
  
  // If the error message itself looks human-readable (no stack traces, no internal method names)
  if (errorMessage && !errorMessage.includes('at ') && !errorMessage.includes('Error:') && errorMessage.length < 200) {
    return sanitizeBackendMessage(errorMessage);
  }
  
  return null;
}

/**
 * Sanitizes backend error messages by removing stack traces,
 * internal method/function names, and sensitive tokens.
 */
function sanitizeBackendMessage(message: string): string {
  let sanitized = message;
  
  // Remove stack trace lines
  sanitized = sanitized.split('\n')[0];
  
  // Remove internal method/function references
  sanitized = sanitized.replace(/\b(at|in)\s+\w+\.\w+/gi, '');
  sanitized = sanitized.replace(/\bfunction\s+\w+/gi, '');
  sanitized = sanitized.replace(/\bmethod\s+\w+/gi, '');
  
  // Remove file paths and line numbers
  sanitized = sanitized.replace(/\([^)]*\.mo:\d+:\d+\)/g, '');
  sanitized = sanitized.replace(/\([^)]*\.ts:\d+:\d+\)/g, '');
  
  // Clean up extra whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Translates backend signup errors into user-friendly messages
 * without exposing internal backend method names or the admin password.
 */
export function translateSignupError(error: any): string {
  const errorMessage = error?.message || '';

  // Try to extract a meaningful backend message first
  const backendMessage = extractBackendMessage(error);
  if (backendMessage) {
    // Handle admin signup password errors specifically
    if (backendMessage.toLowerCase().includes('incorrect signup password')) {
      return 'Invalid admin signup password.';
    }
    
    // Handle profile already exists with custom message
    if (backendMessage.toLowerCase().includes('profile already exists')) {
      return 'You already have an account. Please log out and log in again if you need to update your profile.';
    }
    
    // Handle anonymous user attempts
    if (backendMessage.toLowerCase().includes('anonymous')) {
      return 'Please authenticate with Internet Identity before signing up.';
    }
    
    // Handle admin role assignment errors
    if (backendMessage.toLowerCase().includes('admin') && backendMessage.toLowerCase().includes('role')) {
      return 'Admin accounts are restricted and pre-approved. All new signups are assigned the Engineer role.';
    }

    // Handle admin allowlist errors
    if (backendMessage.toLowerCase().includes('allowlist')) {
      return 'Admin signup failed: Your name is not on the admin allowlist. Please contact your system administrator.';
    }
    
    // Return the sanitized backend message for other cases
    return backendMessage;
  }

  // Handle genuine auth/session errors only (not missing profile)
  if (isAuthError(error) && !isMissingProfileError(error)) {
    return 'There was an authorization issue. Please try logging out and signing up again.';
  }

  // Generic fallback only when no meaningful message can be extracted
  return 'Signup failed. Please check your information and try again.';
}
