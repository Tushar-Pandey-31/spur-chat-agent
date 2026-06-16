/**
 * Graceful degradation — provides friendly fallback responses
 * when the LLM service is unavailable.
 */

const FALLBACK_RESPONSES: Record<string, string> = {
  rate_limit: "I'm experiencing high demand right now. Please try again in a moment, or email us at support@spurshop.com for immediate assistance.",
  timeout: "I'm sorry, it's taking longer than usual to process your request. Please try again, or reach us at support@spurshop.com.",
  auth_error: "I'm temporarily unavailable. Please contact us directly at support@spurshop.com or call us during business hours (Mon-Fri, 9AM-6PM EST).",
  default: "I apologize, but I'm having trouble processing your request right now. You can reach our human support team at support@spurshop.com or try again shortly.",
};

export function getFallbackResponse(errorCode?: string): string {
  switch (errorCode) {
    case 'LLM_RATE_LIMITED':
      return FALLBACK_RESPONSES.rate_limit!;
    case 'LLM_TIMEOUT':
      return FALLBACK_RESPONSES.timeout!;
    case 'VALIDATION_ERROR':
      return "I couldn't understand your message. Could you rephrase it?";
    default:
      return FALLBACK_RESPONSES.default!;
  }
}
