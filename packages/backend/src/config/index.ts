import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Redis (optional for the assignment)
  REDIS_URL: z.string().optional(),

  // LLM Provider selection
  LLM_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required').optional(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),

  // Server
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  // LLM Config
  LLM_MODEL: z.string().optional(),
  LLM_MAX_TOKENS: z.coerce.number().int().positive().default(1024),
  LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
}).refine(
  (data) => {
    if (data.LLM_PROVIDER === 'openai') return !!data.OPENAI_API_KEY;
    if (data.LLM_PROVIDER === 'anthropic') return !!data.ANTHROPIC_API_KEY;
    return false;
  },
  {
    message: 'OPENAI_API_KEY is required when LLM_PROVIDER is "openai", or ANTHROPIC_API_KEY when "anthropic"',
  }
);

export type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Invalid environment variables:');
      for (const issue of result.error.issues) {
        console.error(`  ${issue.path.join('.')}: ${issue.message}`);
      }
      process.exit(1);
    }
    _env = result.data;
  }
  return _env;
}
