import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().default("mongodb://localhost:27017/wealthwise"),
  CONTEXT_PORT: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().positive())
    .default("5300"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.format();
    const messages: string[] = [];
    for (const [key, value] of Object.entries(formatted)) {
      if (key === "_errors") continue;
      const fieldErrors = value as { _errors?: string[] };
      if (fieldErrors._errors && fieldErrors._errors.length > 0) {
        messages.push(`  ${key}: ${fieldErrors._errors.join(", ")}`);
      }
    }
    throw new Error(`Invalid environment variables:\n${messages.join("\n")}`);
  }
  return result.data;
}

export const env = loadEnv();
