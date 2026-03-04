import cors from "cors";

/**
 * CORS configuration.
 * Reflects any request origin so the API accepts all callers, including
 * credentialed browser requests.
 */
export const corsMiddleware = cors({
  origin: (_origin, callback) => {
    callback(null, true);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // 24 hours preflight cache
});
