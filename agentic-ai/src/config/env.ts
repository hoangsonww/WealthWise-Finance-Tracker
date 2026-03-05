import { z } from "zod";

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  MCP_SERVER_URL: z.string().url("MCP_SERVER_URL must be a valid URL"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  AGENT_PORT: z.coerce.number().default(5200),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const messages = Object.entries(formatted)
      .filter(([key]) => key !== "_errors")
      .map(([key, value]) => {
        const errors = (value as { _errors: string[] })._errors;
        return `  ${key}: ${errors.join(", ")}`;
      })
      .join("\n");

    throw new Error(`Environment validation failed:\n${messages}`);
  }

  return result.data;
}
