import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";
import { McpToolError } from "../utils/errors";

interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export function resolveUserId(transport: string, token?: string): string {
  const env = getEnv();

  if (transport === "stdio") {
    const userId = process.env.MCP_USER_ID;
    if (!userId) {
      throw McpToolError.unauthorized(
        "MCP_USER_ID must be set when using stdio transport"
      );
    }
    return userId;
  }

  if (!token) {
    throw McpToolError.unauthorized("Authorization token is required");
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (!decoded.userId) {
      throw McpToolError.unauthorized("Invalid token: missing userId");
    }
    return decoded.userId;
  } catch (error) {
    if (error instanceof McpToolError) throw error;
    throw McpToolError.unauthorized("Invalid or expired token");
  }
}
