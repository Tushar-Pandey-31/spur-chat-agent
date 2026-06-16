/**
 * Prompt injection detection — lightweight guardrail.
 * Flags suspicious patterns without being overly aggressive.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /forget\s+(everything|all|your)\s+(you|instructions?|rules?)/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /act\s+as\s+(if|though)\s+you/i,
  /pretend\s+you\s+(are|were|'re)/i,
  /disregard\s+(all|any|your)\s+(previous|prior|instructions?|rules?)/i,
  /new\s+instructions?\s*:/i,
  /override\s+(your|the)\s+(instructions?|rules?|programming)/i,
];

export interface InjectionCheckResult {
  flagged: boolean;
  patterns: string[];
}

export function checkPromptInjection(message: string): InjectionCheckResult {
  const matchedPatterns: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      matchedPatterns.push(pattern.source);
    }
  }

  return {
    flagged: matchedPatterns.length > 0,
    patterns: matchedPatterns,
  };
}
