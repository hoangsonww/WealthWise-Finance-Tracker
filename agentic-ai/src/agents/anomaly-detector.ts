import Anthropic from "@anthropic-ai/sdk";
import { BaseAgent } from "./base-agent";

export class AnomalyDetectorAgent extends BaseAgent {
  constructor(anthropic: Anthropic) {
    super(anthropic, "anomaly-detector");
  }

  getSystemPrompt(): string {
    return this.loadPrompt("anomaly-detector.md");
  }
}
