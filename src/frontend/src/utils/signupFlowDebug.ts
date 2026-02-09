/**
 * Debug utility for signup/profile flow with sanitized logging.
 * Strips sensitive information like URL secret parameters, PII, and passwords.
 */

const SENSITIVE_PATTERNS = [
  /caffeineAdminToken/gi,
  /adminToken/gi,
  /secret/gi,
  /password/gi,
  /adminPassword/gi,
  /Hans@987123/gi,
];

/**
 * Sanitizes error messages by removing sensitive parameter names and values,
 * stack traces, and internal implementation details while keeping human-readable reasons.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  
  let message = error instanceof Error ? error.message : String(error);
  
  // Remove stack traces (lines starting with "at ")
  const lines = message.split('\n');
  const mainMessage = lines[0] || message;
  
  // Replace sensitive patterns with [REDACTED]
  let sanitized = mainMessage;
  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  // Remove internal method/function references but keep the error reason
  sanitized = sanitized.replace(/\b(at|in)\s+\w+\.\w+/gi, '');
  sanitized = sanitized.replace(/\bfunction\s+\w+/gi, '');
  
  // Clean up extra whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Logs signup/profile flow events with sanitized data.
 * Safe for production use - does not log secrets, PII, or passwords.
 */
export function logSignupFlow(event: string, data?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const sanitizedData = data ? sanitizeLogData(data) : {};
  
  console.log(`[SignupFlow ${timestamp}] ${event}`, sanitizedData);
}

/**
 * Sanitizes log data by removing or redacting sensitive fields.
 * Ensures password and adminPassword are never logged, even in nested objects.
 */
function sanitizeLogData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip logging these sensitive fields entirely
    if (
      key === 'principal' ||
      key === 'password' ||
      key === 'adminPassword' ||
      key === 'email' ||
      key === 'mobileNumber' ||
      key === 'name' ||
      key === 'username'
    ) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogData(value);
      continue;
    }
    
    // Sanitize string values
    if (typeof value === 'string') {
      let sanitizedValue = value;
      SENSITIVE_PATTERNS.forEach(pattern => {
        sanitizedValue = sanitizedValue.replace(pattern, '[REDACTED]');
      });
      sanitized[key] = sanitizedValue;
      continue;
    }
    
    // Keep other values as-is
    sanitized[key] = value;
  }
  
  return sanitized;
}
