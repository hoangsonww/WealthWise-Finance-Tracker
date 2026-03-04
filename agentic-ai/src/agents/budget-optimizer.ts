import Anthropic from "@anthropic-ai/sdk";
import { BaseAgent } from "./base-agent";

export class BudgetOptimizerAgent extends BaseAgent {
  constructor(anthropic: Anthropic) {
    super(anthropic, "budget-optimizer");
  }

  getSystemPrompt(): string {
    return this.loadPrompt("budget-optimizer.md");
  }
}
