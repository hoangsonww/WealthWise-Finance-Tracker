import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";

type Message = Anthropic.MessageParam;

interface Conversation {
  id: string;
  messages: Message[];
  lastActivity: Date;
}

export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  private ttlMs: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(ttlMs: number = 30 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  startCleanup(intervalMs: number = 5 * 60 * 1000): void {
    this.cleanupInterval = setInterval(() => this.cleanup(), intervalMs);
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  getOrCreate(userId: string): Conversation {
    const existing = this.conversations.get(userId);
    if (existing) {
      existing.lastActivity = new Date();
      return existing;
    }

    const conversation: Conversation = {
      id: randomUUID(),
      messages: [],
      lastActivity: new Date(),
    };
    this.conversations.set(userId, conversation);
    return conversation;
  }

  addMessage(userId: string, role: "user" | "assistant", content: string): void {
    const conversation = this.getOrCreate(userId);
    conversation.messages.push({ role, content });
    conversation.lastActivity = new Date();
  }

  getHistory(userId: string): Message[] {
    const conversation = this.conversations.get(userId);
    return conversation?.messages ?? [];
  }

  clear(userId: string): void {
    this.conversations.delete(userId);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [userId, conversation] of this.conversations) {
      if (now - conversation.lastActivity.getTime() > this.ttlMs) {
        this.conversations.delete(userId);
      }
    }
  }
}
