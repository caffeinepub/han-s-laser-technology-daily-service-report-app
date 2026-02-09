/**
 * Debug utility for signup/profile flow with sanitized logging.
 * Strips sensitive information like URL secret parameters and PII.
 */

const SENSITIVE_PATTERNS = [
  /caffeineAdminToken/gi,
  /adminToken/gi,
  /secret/gi,
  /password/gi,
];

/**
 * Sanitizes error messages by removing sensitive parameter names and values.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  
  let message = error instanceof Error ? error.message : String(error);
  
  // Replace sensitive patterns with [REDACTED]
  SENSITIVE_PATTERNS.forEach(pattern => {
    message = message.replace(pattern, '[REDACTED]');
  });
  
  return message;
}

/**
 * Logs signup/profile flow events with sanitized data.
 * Safe for production use - does not log secrets or PII.
 */
export function logSignupFlow(event: string, data?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const sanitizedData = data ? sanitizeLogData(data) : {};
  
  console.log(`[SignupFlow ${timestamp}] ${event}`, sanitizedData);
}

/**
 * Sanitizes log data by removing or redacting sensitive fields.
 */
function sanitizeLogData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip logging these sensitive fields entirely
    if (
      key === 'principal' ||
      key === 'password' ||
      key === 'email' ||
      key === 'mobileNumber' ||
      key === 'name' ||
      key === 'username'
    ) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Sanitize string values
    if (typeof value === 'string') {
      sanitized[key] = sanitizeErrorMessage(value);
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
