import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { resolveUserId } from "../../auth/token-resolver";

const JWT_SECRET = process.env.JWT_SECRET!;

describe("token-resolver", () => {
  describe("stdio transport", () => {
    it("should return MCP_USER_ID when transport is stdio", () => {
      const userId = resolveUserId("stdio");
      expect(userId).toBe("000000000000000000000000");
    });

    it("should throw when MCP_USER_ID is not set for stdio", () => {
      const original = process.env.MCP_USER_ID;
      delete process.env.MCP_USER_ID;
      try {
        expect(() => resolveUserId("stdio")).toThrow(
          "MCP_USER_ID must be set when using stdio transport",
        );
      } finally {
        process.env.MCP_USER_ID = original;
      }
    });
  });

  describe("SSE transport", () => {
    it("should extract userId from a valid JWT token", () => {
      const token = jwt.sign({ userId: "user123" }, JWT_SECRET, {
        expiresIn: "1h",
      });
      const userId = resolveUserId("sse", token);
      expect(userId).toBe("user123");
    });

    it("should throw when no token is provided", () => {
      expect(() => resolveUserId("sse")).toThrow(
        "Authorization token is required",
      );
    });

    it("should throw for an invalid token", () => {
      expect(() => resolveUserId("sse", "invalid-token")).toThrow(
        "Invalid or expired token",
      );
    });

    it("should throw for an expired token", () => {
      const token = jwt.sign({ userId: "user123" }, JWT_SECRET, {
        expiresIn: "-1h",
      });
      expect(() => resolveUserId("sse", token)).toThrow(
        "Invalid or expired token",
      );
    });

    it("should throw when token has no userId", () => {
      const token = jwt.sign({ sub: "user123" }, JWT_SECRET, {
        expiresIn: "1h",
      });
      expect(() => resolveUserId("sse", token)).toThrow(
        "Invalid token: missing userId",
      );
    });
  });
});
