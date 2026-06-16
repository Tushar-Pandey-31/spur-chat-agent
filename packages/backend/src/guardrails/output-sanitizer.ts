/**
 * Output sanitization — strips potentially dangerous content from LLM responses.
 * Prevents the AI from leaking internal prompts, system info, or harmful content.
 */

const LEAKED_PATTERNS = [
  /system\s*prompt\s*:/i,
  /you\s+are\s+(a|an)\s+(helpful\s+)?(support\s+)?agent/i,
  /internal\s+(instructions?|config|system)/i,
  /api[_\s]?key/i,
  /password/i,
  /secret/i,
  /token/i,
];

const MAX_RESPONSE_LENGTH = 2000; // characters

export function sanitizeOutput(response: string): string {
  let sanitized = response.trim();

  // Truncate excessively long responses
  if (sanitized.length > MAX_RESPONSE_LENGTH) {
    sanitized = sanitized.slice(0, MAX_RESPONSE_LENGTH) + '...';
  }

  // Check if the LLM accidentally leaked system prompt content
  for (const pattern of LEAKED_PATTERNS) {
    if (pattern.test(sanitized)) {
      // Replace the suspicious section
      sanitized = sanitized.replace(pattern, '[redacted]');
    }
  }

  // Strip any HTML/script tags that might have been injected
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]+>/g, '');

  return sanitized;
}
