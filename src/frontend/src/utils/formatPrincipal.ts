/**
 * Formats a principal ID for display by showing first and last segments
 * @param principal - The full principal ID string
 * @returns Formatted principal string (e.g., "abc12...xyz89")
 */
export function formatPrincipal(principal: string): string {
  if (!principal || principal.length <= 15) {
    return principal;
  }
  
  const start = principal.slice(0, 8);
  const end = principal.slice(-6);
  return `${start}...${end}`;
}

/**
 * Returns the full principal ID without any formatting
 * @param principal - The full principal ID string
 * @returns The complete principal string
 */
export function getFullPrincipal(principal: string): string {
  return principal;
}

/**
 * Formats a username for display with @ prefix
 * @param username - The username string
 * @returns Formatted username with @ prefix
 */
export function formatUsername(username: string): string {
  return username.startsWith('@') ? username : `@${username}`;
}
