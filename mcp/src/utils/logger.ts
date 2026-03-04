import pino from "pino";

function getLogLevel(): string {
  const env = process.env.NODE_ENV ?? "development";
  if (env === "test") return "silent";
  if (env === "production") return "info";
  return "debug";
}

export const logger = pino({
  level: getLogLevel(),
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
});
