import { z } from "zod";

function isProbablyJwt(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  return parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p) && p.length > 0);
}

function isProbablySupabaseSecretKey(value: string): boolean {
  return value.startsWith("sb_secret_") && value.length >= "sb_secret_".length + 20;
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: z.string().optional(),
  SESSION_SECRET: z.string().min(16),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD_HASH: z.string().min(1),
  DATABASE_URL: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1)
    .refine((v) => !v.startsWith("sb_publishable_"), "Must be a secret/service-role key, not a publishable key.")
    .refine((v) => isProbablySupabaseSecretKey(v) || isProbablyJwt(v), "Must be a Supabase secret key (sb_secret_...) or a legacy JWT."),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("rental-images"),
  PHOTOS_ENC_KEY: z.string().min(32),
  CORS_ORIGIN: z.string().optional()
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const message = Object.entries(flat.fieldErrors)
      .map(([k, v]) => `${k}: ${(v ?? []).join(", ")}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  return parsed.data;
}
