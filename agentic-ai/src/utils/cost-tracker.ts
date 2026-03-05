interface UsageRecord {
  inputTokens: number;
  outputTokens: number;
  requests: number;
  lastModel: string;
  lastUpdated: Date;
}

class CostTracker {
  private usage: Map<string, UsageRecord> = new Map();

  trackUsage(userId: string, inputTokens: number, outputTokens: number, model: string): void {
    const existing = this.usage.get(userId);

    if (existing) {
      existing.inputTokens += inputTokens;
      existing.outputTokens += outputTokens;
      existing.requests += 1;
      existing.lastModel = model;
      existing.lastUpdated = new Date();
    } else {
      this.usage.set(userId, {
        inputTokens,
        outputTokens,
        requests: 1,
        lastModel: model,
        lastUpdated: new Date(),
      });
    }
  }

  getUsage(userId: string): UsageRecord | null {
    return this.usage.get(userId) ?? null;
  }

  resetUsage(userId: string): void {
    this.usage.delete(userId);
  }
}

export const costTracker = new CostTracker();
export type { UsageRecord };
