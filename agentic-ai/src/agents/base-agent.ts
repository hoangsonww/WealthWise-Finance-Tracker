import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { executeToolViaMcp, ClaudeTool } from "../mcp/tool-adapter";
import { logger } from "../utils/logger";
import * as fs from "fs";
import * as path from "path";

export interface AgentResponse {
  response: string;
  agent: string;
  toolCalls: Array<{ name: string; args: Record<string, unknown> }>;
  usage: { inputTokens: number; outputTokens: number };
}

type Message = Anthropic.MessageParam;
type ContentBlock = Anthropic.ContentBlock;

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;
const MAX_TOOL_ITERATIONS = 15;

export abstract class BaseAgent {
  protected anthropic: Anthropic;
  protected name: string;

  constructor(anthropic: Anthropic, name: string) {
    this.anthropic = anthropic;
    this.name = name;
  }

  abstract getSystemPrompt(): string;

  protected loadPrompt(filename: string): string {
    const promptPath = path.resolve(__dirname, "../prompts", filename);
    return fs.readFileSync(promptPath, "utf-8");
  }

  async run(
    userMessage: string,
    tools: ClaudeTool[],
    mcpClient: Client,
    conversationHistory: Message[]
  ): Promise<AgentResponse> {
    const messages: Message[] = [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const toolCalls: Array<{ name: string; args: Record<string, unknown> }> =
      [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: this.getSystemPrompt(),
        messages,
        tools: tools.length > 0 ? tools : undefined,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      if (response.stop_reason === "end_turn" || response.stop_reason !== "tool_use") {
        const textContent = response.content.find(
          (block: ContentBlock) => block.type === "text"
        );
        const text =
          textContent && textContent.type === "text"
            ? textContent.text
            : "No response generated.";

        return {
          response: text,
          agent: this.name,
          toolCalls,
          usage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
          },
        };
      }

      const assistantContent = response.content;
      messages.push({ role: "assistant", content: assistantContent });

      const toolUseBlocks = assistantContent.filter(
        (block: ContentBlock) => block.type === "tool_use"
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;

        const args = (block.input as Record<string, unknown>) ?? {};
        toolCalls.push({ name: block.name, args });

        logger.info({ tool: block.name, args }, "Executing MCP tool");

        try {
          const result = await executeToolViaMcp(mcpClient, block.name, args);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        } catch (error) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Error: ${error}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    }

    logger.warn({ agent: this.name }, "Hit max tool iterations");
    return {
      response: "I was unable to complete the analysis within the allowed steps. Please try a more specific request.",
      agent: this.name,
      toolCalls,
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      },
    };
  }
}
