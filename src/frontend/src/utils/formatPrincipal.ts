/**
 * Format a principal ID for display by showing a shortened version
 * @param principal - The full principal ID string
 * @returns A shortened, human-readable version of the principal
 */
export function formatPrincipal(principal: string): string {
  if (!principal) return '';
  
  // Show first 8 and last 5 characters with ellipsis in between
  if (principal.length > 20) {
    return `${principal.slice(0, 8)}...${principal.slice(-5)}`;
  }
  
  return principal;
}
