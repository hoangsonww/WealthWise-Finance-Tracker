import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";

export class McpToolError extends Error {
  public readonly code: number;

  constructor(message: string, code: number = ErrorCode.InternalError) {
    super(message);
    this.name = "McpToolError";
    this.code = code;
  }

  static notFound(message: string): McpToolError {
    return new McpToolError(message, ErrorCode.InvalidParams);
  }

  static badRequest(message: string): McpToolError {
    return new McpToolError(message, ErrorCode.InvalidParams);
  }

  static unauthorized(message: string): McpToolError {
    return new McpToolError(message, ErrorCode.InvalidRequest);
  }

  static internal(message: string): McpToolError {
    return new McpToolError(message, ErrorCode.InternalError);
  }
}
