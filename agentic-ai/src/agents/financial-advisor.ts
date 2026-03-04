import Anthropic from "@anthropic-ai/sdk";
import { BaseAgent } from "./base-agent";

export class FinancialAdvisorAgent extends BaseAgent {
  constructor(anthropic: Anthropic) {
    super(anthropic, "financial-advisor");
  }

  getSystemPrompt(): string {
    return this.loadPrompt("financial-advisor.md");
  }
}
