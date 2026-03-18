import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeGraph } from "../graph/knowledge-graph";
import { GraphBuilder } from "../graph/builder";
import { KnowledgeBase } from "../knowledge-base/knowledge-base";
import { getFinancialKnowledgeEntries } from "../knowledge-base/financial-rules";
import { ContextEngine } from "../context/context-engine";
import { PromptAssembler } from "../context/prompt-assembler";
import { ContextRetriever } from "../knowledge-base/retriever";
import { NodeType } from "../graph/types";

function buildTestGraphAndKB(): {
  graph: KnowledgeGraph;
  kb: KnowledgeBase;
} {
  const graph = new KnowledgeGraph();
  const userId = "test-user-id";
  const builder = new GraphBuilder(graph, userId);

  builder.buildFromData({
    accounts: [
      {
        _id: "acc-1",
        name: "Main Checking",
        type: "checking",
        balance: 5420.5,
        currency: "USD",
        institution: "Chase",
        userId,
      },
      {
        _id: "acc-2",
        name: "High-Yield Savings",
        type: "savings",
        balance: 15000,
        currency: "USD",
        institution: "Marcus",
        userId,
      },
    ],
    transactions: [
      {
        _id: "tx-1",
        amount: 4500,
        type: "income",
        description: "Monthly Salary",
        date: new Date().toISOString(),
        categoryId: "cat-income",
        accountId: "acc-1",
        userId,
      },
      {
        _id: "tx-2",
        amount: 1500,
        type: "expense",
        description: "Monthly Rent",
        date: new Date().toISOString(),
        categoryId: "cat-housing",
        accountId: "acc-1",
        userId,
      },
      {
        _id: "tx-3",
        amount: 85.5,
        type: "expense",
        description: "Whole Foods",
        date: new Date().toISOString(),
        categoryId: "cat-food",
        accountId: "acc-1",
        userId,
      },
    ],
    budgets: [
      {
        _id: "budget-1",
        name: "Food & Dining",
        amount: 600,
        spent: 485.5,
        period: "monthly",
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
        categoryId: "cat-food",
        userId,
      },
    ],
    goals: [
      {
        _id: "goal-1",
        name: "Emergency Fund",
        targetAmount: 20000,
        currentAmount: 15000,
        deadline: new Date(new Date().getFullYear() + 1, 5, 30).toISOString(),
        status: "in_progress",
        userId,
      },
    ],
    categories: [
      { _id: "cat-income", name: "Income", icon: "dollar", isSystem: true },
      { _id: "cat-housing", name: "Housing", icon: "home", isSystem: true },
      { _id: "cat-food", name: "Food & Dining", icon: "utensils", isSystem: true },
    ],
    recurring: [
      {
        _id: "rec-1",
        name: "Rent",
        amount: 1500,
        frequency: "monthly",
        nextDueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        isActive: true,
        accountId: "acc-1",
        categoryId: "cat-housing",
        userId,
      },
    ],
  });

  const kb = new KnowledgeBase();
  const entries = getFinancialKnowledgeEntries();
  for (const entry of entries) {
    kb.addEntry(entry);
  }

  return { graph, kb };
}

describe("ContextEngine", () => {
  let graph: KnowledgeGraph;
  let kb: KnowledgeBase;
  let engine: ContextEngine;

  beforeEach(() => {
    const setup = buildTestGraphAndKB();
    graph = setup.graph;
    kb = setup.kb;
    engine = new ContextEngine(graph, kb);
  });

  it("should assemble a context window for financial-advisor agent", () => {
    const window = engine.assembleContext({
      userId: "test-user-id",
      agentType: "financial-advisor",
      userMessage: "How can I improve my savings rate?",
    });

    expect(window.systemContext).toBeTruthy();
    expect(window.systemContext).toContain("Financial Advisor");
    expect(window.userContext).toContain("savings rate");
    expect(window.totalTokens).toBeGreaterThan(0);
    expect(window.totalTokens).toBeLessThanOrEqual(window.tokenBudget);
    expect(window.metadata.assembledAt).toBeTruthy();
    expect(window.metadata.components.length).toBeGreaterThan(0);
  });

  it("should assemble a context window for budget-optimizer agent", () => {
    const window = engine.assembleContext({
      userId: "test-user-id",
      agentType: "budget-optimizer",
      userMessage: "Am I overspending on food?",
    });

    expect(window.systemContext).toContain("Budget Optimizer");
    expect(window.totalTokens).toBeGreaterThan(0);
  });

  it("should include conversation history in context", () => {
    const window = engine.assembleContext({
      userId: "test-user-id",
      agentType: "general",
      userMessage: "What about my goals?",
      conversationHistory: [
        { role: "user", content: "Show me my finances" },
        { role: "assistant", content: "Here is your financial overview..." },
      ],
    });

    expect(window.conversationContext).toContain("Show me my finances");
    expect(window.conversationContext).toContain("financial overview");
  });

  it("should include additional context when provided", () => {
    const window = engine.assembleContext({
      userId: "test-user-id",
      agentType: "general",
      userMessage: "Help me budget",
      additionalContext: "I just got a raise to $5500/month",
    });

    expect(window.userContext).toContain("raise to $5500");
  });

  it("should respect token budget", () => {
    const smallBudget = new ContextEngine(graph, kb, {
      maxTotalTokens: 500,
    });

    const window = smallBudget.assembleContext({
      userId: "test-user-id",
      agentType: "financial-advisor",
      userMessage: "Give me a detailed analysis of my spending patterns",
    });

    expect(window.totalTokens).toBeLessThanOrEqual(500);
    expect(window.metadata.truncations.length).toBeGreaterThan(0);
  });

  it("should update context with new information", () => {
    const window = engine.assembleContext({
      userId: "test-user-id",
      agentType: "general",
      userMessage: "Show my accounts",
    });

    const originalTokens = window.totalTokens;

    const updated = engine.updateContext(window, "I also want to see my credit card");

    expect(updated.userContext).toContain("credit card");
    expect(updated.metadata.truncations.length).toBeGreaterThanOrEqual(
      window.metadata.truncations.length
    );
  });

  it("should use general agent context for unknown agent types", () => {
    const window = engine.assembleContext({
      userId: "test-user-id",
      agentType: "unknown-agent",
      userMessage: "Help me",
    });

    expect(window.systemContext).toContain("WealthWise AI financial assistant");
  });

  it("should estimate tokens correctly", () => {
    const tokens = engine.estimateTokens("Hello world, this is a test.");
    // ~28 chars / 4 = 7 tokens
    expect(tokens).toBe(7);
    expect(engine.estimateTokens("")).toBe(0);
  });
});

describe("PromptAssembler", () => {
  let graph: KnowledgeGraph;
  let kb: KnowledgeBase;
  let engine: ContextEngine;
  let assembler: PromptAssembler;

  beforeEach(() => {
    const setup = buildTestGraphAndKB();
    graph = setup.graph;
    kb = setup.kb;
    engine = new ContextEngine(graph, kb);
    assembler = new PromptAssembler();
  });

  it("should assemble a system prompt from context window", () => {
    const window = engine.assembleContext({
      userId: "test-user-id",
      agentType: "financial-advisor",
      userMessage: "How am I doing financially?",
    });

    const prompt = assembler.assembleSystemPrompt(window);
    expect(prompt).toBeTruthy();
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain("Financial Advisor");
  });

  it("should format graph data as text", () => {
    const text = PromptAssembler.formatGraphAsText([
      {
        label: "Main Checking",
        type: "account",
        properties: { balance: 5420.5, currency: "USD" },
      },
      {
        label: "Food & Dining",
        type: "category",
        properties: { totalSpent: 485.5 },
      },
    ]);

    expect(text).toContain("Main Checking");
    expect(text).toContain("Food & Dining");
    expect(text).toContain("5,420.5");
  });

  it("should format knowledge entries as text", () => {
    const text = PromptAssembler.formatKnowledgeAsText([
      { title: "Budget Tip", content: "Follow the 50/30/20 rule" },
      { title: "Savings Tip", content: "Pay yourself first" },
    ]);

    expect(text).toContain("Budget Tip");
    expect(text).toContain("50/30/20");
    expect(text).toContain("Pay yourself first");
  });

  it("should create a financial summary", () => {
    const window = engine.assembleContext({
      userId: "test-user-id",
      agentType: "general",
      userMessage: "Summarize my finances",
    });

    const summary = PromptAssembler.createFinancialSummary(window);
    expect(summary).toContain("Financial Summary");
  });

  it("should handle empty graph data gracefully", () => {
    const text = PromptAssembler.formatGraphAsText([]);
    expect(text).toBe("No financial data available.");
  });

  it("should handle empty knowledge entries", () => {
    const text = PromptAssembler.formatKnowledgeAsText([]);
    expect(text).toBe("");
  });
});

describe("ContextRetriever", () => {
  let graph: KnowledgeGraph;
  let kb: KnowledgeBase;
  let retriever: ContextRetriever;

  beforeEach(() => {
    const setup = buildTestGraphAndKB();
    graph = setup.graph;
    kb = setup.kb;
    retriever = new ContextRetriever(graph, kb);
  });

  it("should retrieve context for budget intent", () => {
    const result = retriever.retrieve("test-user-id", "budget spending limits");
    expect(result.graphContext.relevantNodes.length).toBeGreaterThanOrEqual(0);
    expect(result.combinedContext).toBeTruthy();
    expect(result.metadata.retrievalTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("should retrieve context for goal intent", () => {
    const result = retriever.retrieve("test-user-id", "savings goal progress");
    expect(result.combinedContext).toBeTruthy();
  });

  it("should retrieve financial advice context", () => {
    const result = retriever.retrieveForFinancialAdvice(
      "test-user-id",
      "How can I reduce my spending?"
    );
    expect(result.knowledgeContext.entries.length).toBeGreaterThan(0);
    expect(result.combinedContext.length).toBeGreaterThan(0);
  });

  it("should trim context to token budget", () => {
    const longText = "x".repeat(100000);
    const trimmed = retriever.trimToTokenBudget(longText, 100);
    const tokenEstimate = retriever.estimateTokens(trimmed);
    expect(tokenEstimate).toBeLessThanOrEqual(120); // Allow some overhead for suffix
  });
});
