import { KnowledgeBase } from "../knowledge-base/knowledge-base";
import { getFinancialKnowledgeEntries } from "../knowledge-base/financial-rules";
import { KnowledgeGraph } from "../graph/knowledge-graph";
import { GraphBuilder } from "../graph/builder";

/**
 * Seed script: populates the knowledge base with financial rules
 * and optionally creates a demo graph.
 *
 * Usage:
 *   npx tsx src/seeds/seed-knowledge.ts [--demo]
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const includeDemo = args.includes("--demo");

  console.log("=== WealthWise Context Engineering - Knowledge Seeder ===\n");

  // 1. Load knowledge base
  const kb = new KnowledgeBase();
  const entries = getFinancialKnowledgeEntries();

  for (const entry of entries) {
    kb.addEntry(entry);
  }

  const stats = kb.getStats();
  console.log(`Knowledge Base loaded:`);
  console.log(`  Total entries: ${stats.totalEntries}`);
  console.log(`  Categories:`);
  for (const [cat, count] of Object.entries(stats.entriesByCategory)) {
    if (count > 0) {
      console.log(`    ${cat}: ${count}`);
    }
  }
  console.log(`  Top tags:`);
  for (const tag of stats.topTags.slice(0, 10)) {
    console.log(`    ${tag.tag}: ${tag.count}`);
  }
  console.log(`  Average relevance score: ${stats.averageRelevanceScore.toFixed(2)}\n`);

  // 2. Test search
  console.log("Testing BM25 search...");
  const searchTests = [
    "emergency fund savings",
    "budget overspending",
    "credit score improvement",
    "retirement planning",
    "debt payoff strategy",
  ];

  for (const query of searchTests) {
    const results = kb.search(query, { limit: 3 });
    console.log(`\n  Query: "${query}"`);
    for (const result of results) {
      console.log(
        `    [${result.score.toFixed(3)}] ${result.entry.title} (matched: ${result.matchedTerms.join(", ")})`
      );
    }
  }

  // 3. Optionally create demo graph
  if (includeDemo) {
    console.log("\n\nBuilding demo knowledge graph...");
    const graph = new KnowledgeGraph();
    const demoUserId = "demo-user-000000000000";
    const builder = new GraphBuilder(graph, demoUserId);

    builder.buildFromData({
      accounts: [
        {
          _id: "acc-1",
          name: "Main Checking",
          type: "checking",
          balance: 5420.5,
          currency: "USD",
          institution: "Chase",
          userId: demoUserId,
        },
        {
          _id: "acc-2",
          name: "High-Yield Savings",
          type: "savings",
          balance: 15000,
          currency: "USD",
          institution: "Marcus",
          userId: demoUserId,
        },
        {
          _id: "acc-3",
          name: "Credit Card",
          type: "credit_card",
          balance: -1250.75,
          currency: "USD",
          institution: "Discover",
          userId: demoUserId,
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
          userId: demoUserId,
        },
        {
          _id: "tx-2",
          amount: 1500,
          type: "expense",
          description: "Monthly Rent Payment",
          date: new Date().toISOString(),
          categoryId: "cat-housing",
          accountId: "acc-1",
          userId: demoUserId,
        },
        {
          _id: "tx-3",
          amount: 85.5,
          type: "expense",
          description: "Whole Foods Groceries",
          date: new Date().toISOString(),
          categoryId: "cat-food",
          accountId: "acc-1",
          tags: ["groceries"],
          userId: demoUserId,
        },
        {
          _id: "tx-4",
          amount: 120,
          type: "expense",
          description: "Electric Utility Bill",
          date: new Date().toISOString(),
          categoryId: "cat-utilities",
          accountId: "acc-1",
          userId: demoUserId,
        },
        {
          _id: "tx-5",
          amount: 52.99,
          type: "expense",
          description: "Netflix Streaming Service",
          date: new Date().toISOString(),
          categoryId: "cat-entertainment",
          accountId: "acc-3",
          tags: ["subscription"],
          userId: demoUserId,
        },
        {
          _id: "tx-6",
          amount: 500,
          type: "transfer",
          description: "Transfer to Savings",
          date: new Date().toISOString(),
          accountId: "acc-1",
          userId: demoUserId,
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
          userId: demoUserId,
        },
        {
          _id: "budget-2",
          name: "Entertainment",
          amount: 200,
          spent: 252.99,
          period: "monthly",
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
          categoryId: "cat-entertainment",
          userId: demoUserId,
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
          userId: demoUserId,
        },
        {
          _id: "goal-2",
          name: "Vacation Fund",
          targetAmount: 5000,
          currentAmount: 1200,
          deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
          status: "in_progress",
          userId: demoUserId,
        },
      ],
      categories: [
        {
          _id: "cat-income",
          name: "Income",
          icon: "dollar-sign",
          isSystem: true,
        },
        {
          _id: "cat-housing",
          name: "Housing",
          icon: "home",
          isSystem: true,
        },
        {
          _id: "cat-food",
          name: "Food & Dining",
          icon: "utensils",
          isSystem: true,
        },
        {
          _id: "cat-utilities",
          name: "Utilities",
          icon: "zap",
          isSystem: true,
        },
        {
          _id: "cat-entertainment",
          name: "Entertainment",
          icon: "tv",
          isSystem: true,
        },
      ],
      recurring: [
        {
          _id: "rec-1",
          name: "Netflix",
          amount: 15.99,
          frequency: "monthly",
          nextDueDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            15
          ).toISOString(),
          isActive: true,
          accountId: "acc-3",
          categoryId: "cat-entertainment",
          userId: demoUserId,
        },
        {
          _id: "rec-2",
          name: "Rent",
          amount: 1500,
          frequency: "monthly",
          nextDueDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            1
          ).toISOString(),
          isActive: true,
          accountId: "acc-1",
          categoryId: "cat-housing",
          userId: demoUserId,
        },
      ],
    });

    const graphStats = graph.getStats();
    console.log(`\nDemo Knowledge Graph built:`);
    console.log(`  Total nodes: ${graphStats.totalNodes}`);
    console.log(`  Total edges: ${graphStats.totalEdges}`);
    console.log(`  Connected components: ${graphStats.connectedComponents}`);
    console.log(`  Average degree: ${graphStats.averageDegree.toFixed(2)}`);
    console.log(`  Density: ${graphStats.density.toFixed(4)}`);
    console.log(`\n  Nodes by type:`);
    for (const [type, count] of Object.entries(graphStats.nodesByType)) {
      if (count > 0) {
        console.log(`    ${type}: ${count}`);
      }
    }
    console.log(`\n  Top nodes by degree:`);
    for (const node of graphStats.topNodesByDegree.slice(0, 5)) {
      console.log(`    ${node.label} (${node.nodeId}): degree ${node.degree}`);
    }
  }

  console.log("\n=== Seeding complete ===");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
