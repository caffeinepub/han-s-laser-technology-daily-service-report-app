/**
 * Translates backend signup errors into user-friendly messages
 * without exposing internal backend method names.
 */
export function translateSignupError(error: any): string {
  const errorMessage = error?.message || '';

  // Handle profile already exists
  if (errorMessage.includes('Profile already exists')) {
    return 'You already have an account. Please log out and log in again if you need to update your profile.';
  }

  // Handle unauthorized/role assignment errors (should not happen during signup, but just in case)
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('Only admins')) {
    return 'There was an authorization issue. Please try logging out and signing up again.';
  }

  // Generic fallback
  return 'Signup failed. Please check your information and try again.';
}
