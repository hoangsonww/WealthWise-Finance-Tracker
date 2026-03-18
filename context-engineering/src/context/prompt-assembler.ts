import { ContextWindow } from "./types";

/**
 * Formats context windows into agent-ready prompts.
 */
export class PromptAssembler {
  /**
   * Assemble a complete system prompt from a context window.
   */
  assembleSystemPrompt(window: ContextWindow): string {
    const parts: string[] = [];

    // System instructions always come first
    if (window.systemContext) {
      parts.push(window.systemContext);
    }

    // Graph context (financial data)
    if (window.graphContext) {
      parts.push("---\n\n# User's Financial Data\n\n" + window.graphContext);
    }

    // Knowledge context (financial rules and tips)
    if (window.knowledgeContext) {
      parts.push("---\n\n# Relevant Financial Knowledge\n\n" + window.knowledgeContext);
    }

    // Conversation history
    if (window.conversationContext) {
      parts.push("---\n\n# Conversation History\n\n" + window.conversationContext);
    }

    // Token budget info for the agent
    parts.push(`---\n\n[Context: ${window.totalTokens}/${window.tokenBudget} tokens used]`);

    return parts.join("\n\n");
  }

  /**
   * Format graph node data as structured text for LLM consumption.
   */
  static formatGraphAsText(
    nodes: Array<{
      label: string;
      type: string;
      properties: Record<string, unknown>;
    }>
  ): string {
    if (nodes.length === 0) return "No financial data available.";

    const lines: string[] = [];

    // Group by type
    const grouped = new Map<string, typeof nodes>();
    for (const node of nodes) {
      if (!grouped.has(node.type)) {
        grouped.set(node.type, []);
      }
      grouped.get(node.type)!.push(node);
    }

    for (const [type, typeNodes] of grouped) {
      const typeName = type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`### ${typeName}s`);

      for (const node of typeNodes) {
        const propsText = Object.entries(node.properties)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => {
            const key = k.replace(/([A-Z])/g, " $1").toLowerCase();
            if (typeof v === "number") {
              return `${key}: ${v.toLocaleString()}`;
            }
            if (Array.isArray(v)) {
              return `${key}: ${v.join(", ")}`;
            }
            return `${key}: ${v}`;
          })
          .join(", ");

        lines.push(`- **${node.label}**: ${propsText}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Format knowledge entries as bullet points.
   */
  static formatKnowledgeAsText(entries: Array<{ title: string; content: string }>): string {
    if (entries.length === 0) return "";

    return entries.map((entry) => `- **${entry.title}**: ${entry.content}`).join("\n\n");
  }

  /**
   * Create a concise financial summary from context.
   */
  static createFinancialSummary(context: ContextWindow): string {
    const parts: string[] = [];

    parts.push("# Financial Summary");
    parts.push("");

    if (context.graphContext) {
      // Extract key numbers from graph context
      const lines = context.graphContext.split("\n");
      const keyLines = lines.filter(
        (line) =>
          line.includes("$") ||
          line.includes("%") ||
          line.includes("income") ||
          line.includes("expense") ||
          line.includes("savings") ||
          line.includes("budget") ||
          line.includes("goal")
      );

      if (keyLines.length > 0) {
        parts.push("## Key Metrics");
        for (const line of keyLines.slice(0, 10)) {
          parts.push(line.trim());
        }
        parts.push("");
      }
    }

    if (context.knowledgeContext) {
      parts.push("## Applicable Guidelines");
      // Take first 3 knowledge items
      const kbLines = context.knowledgeContext
        .split("\n")
        .filter((line) => line.trim().startsWith("-"));
      for (const line of kbLines.slice(0, 3)) {
        // Truncate long knowledge entries for the summary
        const truncated = line.length > 200 ? line.substring(0, 200) + "..." : line;
        parts.push(truncated);
      }
      parts.push("");
    }

    parts.push(
      `_Context assembled at ${context.metadata.assembledAt} | ${context.totalTokens} tokens_`
    );

    return parts.join("\n");
  }
}
