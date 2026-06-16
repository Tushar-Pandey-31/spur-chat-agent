/**
 * Custom error hierarchy for the application.
 * All operational errors extend AppError so the centralized
 * error middleware can handle them uniformly.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class LLMError extends AppError {
  constructor(message: string, statusCode: number = 502, code: string = 'LLM_ERROR') {
    super(message, statusCode, code);
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(message: string = 'The AI service is busy. Please try again in a moment.') {
    super(message, 429, 'LLM_RATE_LIMITED');
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(message: string = 'The AI service took too long to respond. Please try again.') {
    super(message, 408, 'LLM_TIMEOUT');
  }
}

export class PromptInjectionError extends AppError {
  constructor(message: string = 'Your message contains content that cannot be processed.') {
    super(message, 400, 'PROMPT_INJECTION_DETECTED');
  }
}
