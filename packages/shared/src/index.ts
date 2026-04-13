import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  REFRESH_TOKEN_SECRET: z.string().min(1),
  EVOLUTION_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  REDIS_URL: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

// Export as base schemas for API and other apps
export const TenantHeadersSchema = z.object({
  'x-tenant-id': z.string().uuid().optional(), // Ou extrair isso do JWT
});
