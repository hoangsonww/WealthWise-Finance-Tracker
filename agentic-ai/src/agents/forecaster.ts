import Anthropic from "@anthropic-ai/sdk";
import { BaseAgent } from "./base-agent";

export class ForecasterAgent extends BaseAgent {
  constructor(anthropic: Anthropic) {
    super(anthropic, "forecaster");
  }

  getSystemPrompt(): string {
    return this.loadPrompt("forecaster.md");
  }
}
