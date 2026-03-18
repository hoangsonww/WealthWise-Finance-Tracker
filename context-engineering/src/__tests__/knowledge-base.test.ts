import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeBase } from "../knowledge-base/knowledge-base";
import { KnowledgeEntry, KnowledgeCategory } from "../knowledge-base/types";
import { getFinancialKnowledgeEntries } from "../knowledge-base/financial-rules";

function makeEntry(
  id: string,
  title: string,
  content: string,
  category: KnowledgeCategory,
  tags: string[],
  relevanceScore: number = 0.8
): KnowledgeEntry {
  const now = new Date().toISOString();
  return {
    id,
    title,
    content,
    category,
    tags,
    relevanceScore,
    metadata: {
      source: "test",
      createdAt: now,
      updatedAt: now,
      version: 1,
      usageCount: 0,
    },
  };
}

describe("KnowledgeBase", () => {
  let kb: KnowledgeBase;

  beforeEach(() => {
    kb = new KnowledgeBase();
  });

  // --- CRUD ---

  it("should add and retrieve an entry", () => {
    const entry = makeEntry(
      "e1",
      "Budget Rule",
      "Follow the 50/30/20 rule for budgeting",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting", "50-30-20"]
    );
    kb.addEntry(entry);

    expect(kb.size).toBe(1);

    const retrieved = kb.getEntry("e1");
    expect(retrieved).toBeDefined();
    expect(retrieved!.title).toBe("Budget Rule");
  });

  it("should remove an entry", () => {
    const entry = makeEntry(
      "e1",
      "Budget Rule",
      "Follow the 50/30/20 rule",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting"]
    );
    kb.addEntry(entry);
    expect(kb.size).toBe(1);

    const removed = kb.removeEntry("e1");
    expect(removed).toBe(true);
    expect(kb.size).toBe(0);
    expect(kb.getEntry("e1")).toBeUndefined();
  });

  it("should update an entry", () => {
    const entry = makeEntry(
      "e1",
      "Budget Rule",
      "Follow the 50/30/20 rule",
      KnowledgeCategory.BudgetingStrategy,
      ["budgeting"]
    );
    kb.addEntry(entry);

    const updated = kb.updateEntry("e1", { title: "Updated Budget Rule" });
    expect(updated).toBe(true);

    const retrieved = kb.getEntry("e1");
    expect(retrieved!.title).toBe("Updated Budget Rule");
    expect(retrieved!.metadata.version).toBe(2);
  });

  it("should return false when removing non-existent entry", () => {
    expect(kb.removeEntry("nonexistent")).toBe(false);
  });

  // --- BM25 Search ---

  it("should perform BM25 search and rank results", () => {
    kb.addEntry(
      makeEntry(
        "e1",
        "Emergency Fund Basics",
        "Save 3-6 months of expenses in an emergency fund for financial security",
        KnowledgeCategory.EmergencyFund,
        ["emergency", "savings"]
      )
    );
    kb.addEntry(
      makeEntry(
        "e2",
        "Budget Planning",
        "Create a monthly budget to track income and expenses",
        KnowledgeCategory.BudgetingStrategy,
        ["budgeting", "planning"]
      )
    );
    kb.addEntry(
      makeEntry(
        "e3",
        "Emergency Preparedness",
        "Build an emergency fund before investing aggressively",
        KnowledgeCategory.EmergencyFund,
        ["emergency", "investing"]
      )
    );

    const results = kb.search("emergency fund savings");
    expect(results.length).toBeGreaterThan(0);
    // Emergency-related entries should rank highest
    expect(results[0].entry.category).toBe(KnowledgeCategory.EmergencyFund);
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].matchedTerms.length).toBeGreaterThan(0);
  });

  it("should return empty results for queries with no matches", () => {
    kb.addEntry(
      makeEntry(
        "e1",
        "Budget Rule",
        "Follow the 50/30/20 rule for budgeting",
        KnowledgeCategory.BudgetingStrategy,
        ["budgeting"]
      )
    );

    const results = kb.search("cryptocurrency blockchain");
    expect(results).toHaveLength(0);
  });

  it("should respect search limit", () => {
    for (let i = 0; i < 20; i++) {
      kb.addEntry(
        makeEntry(
          `e${i}`,
          `Budget Tip ${i}`,
          `Budget tip number ${i} about saving money and spending wisely`,
          KnowledgeCategory.BudgetingStrategy,
          ["budgeting", "saving", "money"]
        )
      );
    }

    const results = kb.search("budget saving money", { limit: 5 });
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it("should filter search by category", () => {
    kb.addEntry(
      makeEntry(
        "e1",
        "Save Money on Groceries",
        "Meal planning saves money on groceries and reduces food waste",
        KnowledgeCategory.SpendingOptimization,
        ["spending", "groceries"]
      )
    );
    kb.addEntry(
      makeEntry(
        "e2",
        "Save in Emergency Fund",
        "Save money in your emergency fund for unexpected expenses",
        KnowledgeCategory.EmergencyFund,
        ["savings", "emergency"]
      )
    );

    const results = kb.search("save money", {
      category: KnowledgeCategory.EmergencyFund,
    });

    expect(results.length).toBe(1);
    expect(results[0].entry.id).toBe("e2");
  });

  it("should filter search by tags", () => {
    kb.addEntry(
      makeEntry(
        "e1",
        "Credit Score Tips",
        "Pay bills on time to improve your credit score",
        KnowledgeCategory.CreditScore,
        ["credit", "bills"]
      )
    );
    kb.addEntry(
      makeEntry(
        "e2",
        "Credit Card Management",
        "Keep credit utilization below 30 percent of your limit",
        KnowledgeCategory.CreditScore,
        ["credit", "utilization"]
      )
    );
    kb.addEntry(
      makeEntry(
        "e3",
        "Debt Payoff",
        "Pay down debt to improve your credit score",
        KnowledgeCategory.DebtManagement,
        ["debt", "payoff"]
      )
    );

    const results = kb.search("credit", { tags: ["credit"] });
    // Only e1 and e2 have the "credit" tag
    expect(results.length).toBe(2);
  });

  // --- Category/Tag queries ---

  it("should get entries by category", () => {
    kb.addEntry(
      makeEntry("e1", "Rule 1", "Content 1", KnowledgeCategory.BudgetingStrategy, ["budgeting"])
    );
    kb.addEntry(
      makeEntry("e2", "Rule 2", "Content 2", KnowledgeCategory.BudgetingStrategy, ["budgeting"])
    );
    kb.addEntry(makeEntry("e3", "Rule 3", "Content 3", KnowledgeCategory.SavingsTip, ["savings"]));

    const budget = kb.getByCategory(KnowledgeCategory.BudgetingStrategy);
    expect(budget).toHaveLength(2);

    const savings = kb.getByCategory(KnowledgeCategory.SavingsTip);
    expect(savings).toHaveLength(1);
  });

  it("should get entries by tag", () => {
    kb.addEntry(
      makeEntry("e1", "Rule 1", "Content 1", KnowledgeCategory.BudgetingStrategy, [
        "budgeting",
        "spending",
      ])
    );
    kb.addEntry(
      makeEntry("e2", "Rule 2", "Content 2", KnowledgeCategory.SavingsTip, ["saving", "spending"])
    );

    const spending = kb.getByTag("spending");
    expect(spending).toHaveLength(2);

    const budgeting = kb.getByTag("budgeting");
    expect(budgeting).toHaveLength(1);
  });

  it("should get entries by multiple tags with matchAll", () => {
    kb.addEntry(
      makeEntry("e1", "Rule 1", "Content 1", KnowledgeCategory.BudgetingStrategy, [
        "budgeting",
        "spending",
      ])
    );
    kb.addEntry(
      makeEntry("e2", "Rule 2", "Content 2", KnowledgeCategory.SavingsTip, ["saving", "spending"])
    );

    // matchAll = true: only entries with both tags
    const both = kb.getByTags(["budgeting", "spending"], true);
    expect(both).toHaveLength(1);
    expect(both[0].id).toBe("e1");

    // matchAll = false: entries with either tag
    const either = kb.getByTags(["budgeting", "saving"], false);
    expect(either).toHaveLength(2);
  });

  // --- Statistics ---

  it("should compute knowledge base statistics", () => {
    kb.addEntry(
      makeEntry("e1", "Rule 1", "Content", KnowledgeCategory.BudgetingStrategy, ["budgeting"], 0.9)
    );
    kb.addEntry(
      makeEntry("e2", "Rule 2", "Content", KnowledgeCategory.SavingsTip, ["savings"], 0.7)
    );

    const stats = kb.getStats();
    expect(stats.totalEntries).toBe(2);
    expect(stats.entriesByCategory[KnowledgeCategory.BudgetingStrategy]).toBe(1);
    expect(stats.entriesByCategory[KnowledgeCategory.SavingsTip]).toBe(1);
    expect(stats.averageRelevanceScore).toBe(0.8);
    expect(stats.topTags.length).toBeGreaterThan(0);
  });

  // --- Serialization ---

  it("should serialize and deserialize", () => {
    kb.addEntry(
      makeEntry("e1", "Rule 1", "Content 1", KnowledgeCategory.BudgetingStrategy, ["budgeting"])
    );
    kb.addEntry(makeEntry("e2", "Rule 2", "Content 2", KnowledgeCategory.SavingsTip, ["savings"]));

    const json = kb.toJSON();
    expect(json).toHaveLength(2);

    const restored = KnowledgeBase.fromJSON(json);
    expect(restored.size).toBe(2);

    // Search should work on restored KB
    const results = restored.search("budgeting rule");
    expect(results.length).toBeGreaterThan(0);
  });

  // --- Financial Rules Integration ---

  it("should load all financial rules and search them", () => {
    const entries = getFinancialKnowledgeEntries();
    expect(entries.length).toBeGreaterThanOrEqual(50);

    for (const entry of entries) {
      kb.addEntry(entry);
    }

    expect(kb.size).toBeGreaterThanOrEqual(50);

    // Test various searches
    const budgetResults = kb.search("budget spending limit overspending");
    expect(budgetResults.length).toBeGreaterThan(0);

    const savingsResults = kb.search("emergency fund savings");
    expect(savingsResults.length).toBeGreaterThan(0);

    const creditResults = kb.search("credit score improvement");
    expect(creditResults.length).toBeGreaterThan(0);

    const debtResults = kb.search("debt payoff avalanche snowball");
    expect(debtResults.length).toBeGreaterThan(0);
  });

  // --- Tokenizer ---

  it("should tokenize text properly, removing stop words", () => {
    const tokens = kb.tokenize("The quick brown fox jumps over the lazy dog");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("over");
    expect(tokens).toContain("quick");
    expect(tokens).toContain("brown");
    expect(tokens).toContain("fox");
    expect(tokens).toContain("jumps");
  });

  it("should handle empty search query", () => {
    kb.addEntry(makeEntry("e1", "Rule", "Content", KnowledgeCategory.BudgetingStrategy, []));

    const results = kb.search("");
    expect(results).toHaveLength(0);
  });
});
