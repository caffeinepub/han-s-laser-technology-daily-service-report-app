/**
 * Translates backend signup errors into user-friendly messages.
 * Sanitizes error messages to avoid exposing sensitive information.
 */
export function translateSignupError(error: unknown): string {
  if (!error) return 'An unexpected error occurred during signup';

  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Anonymous/guest user trying to signup
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('only users') ||
    lowerMessage.includes('guest') ||
    lowerMessage.includes('anonymous')
  ) {
    return 'Please sign in with Internet Identity before creating your profile.';
  }

  // Profile already exists
  if (lowerMessage.includes('profile already exists')) {
    return 'You already have a profile. Please contact support if you need to update your information.';
  }

  // Admin signup password error (without exposing the password)
  if (lowerMessage.includes('incorrect signup password')) {
    return 'The admin signup password is incorrect. Please contact your system administrator.';
  }

  // Admin allowlist error
  if (lowerMessage.includes('not on the allowlist')) {
    return 'Your name is not authorized for admin access. Please contact your system administrator for additional permissions.';
  }

  // Validation errors
  if (lowerMessage.includes('required') || lowerMessage.includes('invalid')) {
    return 'Please check that all required fields are filled in correctly.';
  }

  // Network/connection errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout')
  ) {
    return 'Network error. Please check your connection and try again.';
  }

  // Sanitize the error message to remove stack traces and internal method names
  const sanitized = errorMessage
    .split('\n')[0] // Take only the first line
    .replace(/at\s+\w+\s*\(.*\)/g, '') // Remove stack trace patterns
    .replace(/\s+in\s+\w+/g, '') // Remove "in MethodName" patterns
    .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
    .trim();

  // If the sanitized message is too technical or empty, return a generic message
  if (
    !sanitized ||
    sanitized.length < 10 ||
    sanitized.includes('trap') ||
    sanitized.includes('canister')
  ) {
    return 'Unable to complete signup. Please try again or contact support.';
  }

  return sanitized;
}
