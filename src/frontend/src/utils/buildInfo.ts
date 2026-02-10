/**
 * Single source of truth for the app's build/version identifier.
 * This value changes with each frontend deployment, enabling cache invalidation
 * and visible version tracking in the UI.
 * 
 * IMPORTANT: For production builds, set VITE_BUILD_VERSION environment variable
 * to ensure a deterministic build identifier that changes only on actual deploys.
 */

const getBuildVersion = (): string => {
  // Check for injected build version from environment (production builds)
  if (import.meta.env.VITE_BUILD_VERSION) {
    return import.meta.env.VITE_BUILD_VERSION;
  }
  
  // Development fallback: use a stable identifier based on import.meta.url
  // This ensures the version is consistent within a single build but changes
  // when the code is rebuilt (Vite will generate a new module URL)
  try {
    // Extract a hash from the module URL if available
    const url = import.meta.url;
    if (url) {
      // Use the last segment of the URL as a stable identifier
      const segments = url.split('/');
      const lastSegment = segments[segments.length - 1] || 'dev';
      return `dev-${lastSegment.substring(0, 12)}`;
    }
  } catch (e) {
    // Fallback if import.meta.url is not available
  }
  
  // Final fallback: use a date-based version (stable within a day)
  const buildDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `dev-${buildDate}`;
};

export const BUILD_VERSION = getBuildVersion();

/**
 * Get a user-friendly build version string for display in the UI
 */
export function getBuildVersionDisplay(): string {
  return `Build: ${BUILD_VERSION}`;
}
