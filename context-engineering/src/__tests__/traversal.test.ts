import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeGraph } from "../graph/knowledge-graph";
import { GraphTraversal } from "../graph/traversal";
import { GraphNode, GraphEdge, NodeType, EdgeType, NodeMetadata } from "../graph/types";

function meta(): NodeMetadata {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    updatedAt: now,
    source: "test",
    userId: "test-user",
    version: 1,
    accessCount: 0,
  };
}

function node(id: string, type: NodeType = NodeType.Account, label?: string): GraphNode {
  const defaults: Record<NodeType, Record<string, unknown>> = {
    [NodeType.Account]: {
      name: label ?? id,
      accountType: "checking",
      balance: 1000,
      currency: "USD",
      isArchived: false,
    },
    [NodeType.Category]: { name: label ?? id, isSystem: false, transactionCount: 0, totalSpent: 0 },
    [NodeType.Transaction]: {
      amount: 100,
      type: "expense",
      description: label ?? id,
      date: new Date().toISOString(),
    },
    [NodeType.Budget]: {
      name: label ?? id,
      amount: 500,
      spent: 200,
      period: "monthly",
      startDate: "",
      endDate: "",
      utilizationPercent: 40,
    },
    [NodeType.Goal]: {
      name: label ?? id,
      targetAmount: 5000,
      currentAmount: 1000,
      progressPercent: 20,
      status: "in_progress",
    },
    [NodeType.RecurringPayment]: {
      name: label ?? id,
      amount: 50,
      frequency: "monthly",
      isActive: true,
    },
    [NodeType.FinancialRule]: {
      title: label ?? id,
      description: "",
      category: "",
      severity: "info",
      condition: "",
      recommendation: "",
    },
    [NodeType.Insight]: {
      title: label ?? id,
      description: "",
      insightType: "test",
      confidence: 0.8,
      generatedAt: "",
      isActionable: true,
    },
    [NodeType.UserProfile]: {
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      savingsRate: 40,
      riskTolerance: "moderate",
      financialGoals: [],
    },
    [NodeType.TimePeriod]: { periodType: "month", startDate: "", endDate: "", label: label ?? id },
    [NodeType.Merchant]: {
      name: label ?? id,
      transactionCount: 5,
      totalSpent: 500,
      averageTransaction: 100,
    },
    [NodeType.Tag]: { name: label ?? id, usageCount: 3 },
  };

  return {
    id,
    type,
    label: label ?? id,
    properties: defaults[type] as GraphNode["properties"],
    metadata: meta(),
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  type: EdgeType = EdgeType.CATEGORIZED_AS,
  weight: number = 0.8
): GraphEdge {
  const now = new Date().toISOString();
  return {
    id,
    source,
    target,
    type,
    weight,
    properties: { label: "test" },
    metadata: { createdAt: now, updatedAt: now, source: "test", userId: "test-user" },
  };
}

describe("GraphTraversal", () => {
  let graph: KnowledgeGraph;
  let traversal: GraphTraversal;

  beforeEach(() => {
    graph = new KnowledgeGraph();
    traversal = new GraphTraversal(graph);
  });

  // Build a simple linear graph: A -> B -> C -> D
  function buildLinearGraph(): void {
    graph.addNode(node("A", NodeType.Account, "A"));
    graph.addNode(node("B", NodeType.Category, "B"));
    graph.addNode(node("C", NodeType.Budget, "C"));
    graph.addNode(node("D", NodeType.Goal, "D"));

    graph.addEdge(edge("e1", "A", "B", EdgeType.CATEGORIZED_AS, 0.9));
    graph.addEdge(edge("e2", "B", "C", EdgeType.BUDGET_FOR_CATEGORY, 0.8));
    graph.addEdge(edge("e3", "C", "D", EdgeType.CONTRIBUTES_TO, 0.7));
  }

  // Build a diamond graph: A -> B, A -> C, B -> D, C -> D
  function buildDiamondGraph(): void {
    graph.addNode(node("A", NodeType.Account, "A"));
    graph.addNode(node("B", NodeType.Category, "B"));
    graph.addNode(node("C", NodeType.Budget, "C"));
    graph.addNode(node("D", NodeType.Goal, "D"));

    graph.addEdge(edge("e1", "A", "B", EdgeType.CATEGORIZED_AS, 0.9));
    graph.addEdge(edge("e2", "A", "C", EdgeType.BUDGET_FOR_ACCOUNT, 0.5));
    graph.addEdge(edge("e3", "B", "D", EdgeType.CONTRIBUTES_TO, 0.8));
    graph.addEdge(edge("e4", "C", "D", EdgeType.FUNDED_BY, 0.6));
  }

  // --- BFS ---

  it("should perform BFS traversal on a linear graph", () => {
    buildLinearGraph();

    const result = traversal.bfs("A");
    expect(result.length).toBe(4);
    // BFS should visit A first
    expect(result[0].id).toBe("A");
  });

  it("should respect maxDepth in BFS", () => {
    buildLinearGraph();

    const result = traversal.bfs("A", { maxDepth: 1 });
    // A (depth 0) -> B (depth 1), should not reach C or D
    expect(result.length).toBe(2);
  });

  it("should respect maxNodes in BFS", () => {
    buildLinearGraph();

    const result = traversal.bfs("A", { maxNodes: 2 });
    expect(result.length).toBe(2);
  });

  it("should return empty array for non-existent start node", () => {
    const result = traversal.bfs("nonexistent");
    expect(result).toEqual([]);
  });

  // --- DFS ---

  it("should perform DFS traversal", () => {
    buildLinearGraph();

    const result = traversal.dfs("A");
    expect(result.length).toBe(4);
    expect(result[0].id).toBe("A");
  });

  it("should respect maxDepth in DFS", () => {
    buildLinearGraph();

    const result = traversal.dfs("A", { maxDepth: 1 });
    expect(result.length).toBe(2);
  });

  // --- Shortest Path ---

  it("should find shortest path in diamond graph", () => {
    buildDiamondGraph();

    const path = traversal.shortestPath("A", "D");
    expect(path).not.toBeNull();
    expect(path!.nodes[0].id).toBe("A");
    expect(path!.nodes[path!.nodes.length - 1].id).toBe("D");
    // Should prefer the path through B (higher weight = lower cost)
    expect(path!.length).toBe(3); // A -> B/C -> D
  });

  it("should return null for unreachable target", () => {
    graph.addNode(node("A", NodeType.Account));
    graph.addNode(node("B", NodeType.Category));
    // No edges

    const path = traversal.shortestPath("A", "B");
    expect(path).toBeNull();
  });

  it("should return null for non-existent nodes", () => {
    const path = traversal.shortestPath("nonexistent1", "nonexistent2");
    expect(path).toBeNull();
  });

  // --- Weighted Traversal ---

  it("should perform weighted traversal preferring higher weights", () => {
    graph.addNode(node("center", NodeType.Account, "Center"));
    graph.addNode(node("high", NodeType.Category, "High Weight"));
    graph.addNode(node("low", NodeType.Budget, "Low Weight"));

    graph.addEdge(edge("e1", "center", "high", EdgeType.CATEGORIZED_AS, 0.95));
    graph.addEdge(edge("e2", "center", "low", EdgeType.BUDGET_FOR_ACCOUNT, 0.1));

    const result = traversal.weightedTraversal("center", { maxNodes: 3 });
    expect(result.length).toBe(3);
    expect(result[0].id).toBe("center");
    // High weight should be visited before low weight
    expect(result[1].id).toBe("high");
    expect(result[2].id).toBe("low");
  });

  // --- All Paths ---

  it("should find all paths in diamond graph", () => {
    buildDiamondGraph();

    const paths = traversal.allPaths("A", "D", 5);
    // Should find 2 paths: A->B->D and A->C->D
    expect(paths.length).toBe(2);
  });

  // --- Context Expansion ---

  it("should expand context from seed nodes", () => {
    buildDiamondGraph();

    const result = traversal.contextExpansion(["A"], {
      maxNodes: 10,
      maxDepth: 3,
      relevanceThreshold: 0.05,
    });

    expect(result.nodes.length).toBeGreaterThanOrEqual(3);
    expect(result.relevanceMap.get("A")).toBe(1.0);
    // Neighbors should have lower relevance
    for (const [nodeId, relevance] of result.relevanceMap) {
      if (nodeId !== "A") {
        expect(relevance).toBeLessThan(1.0);
      }
    }
  });

  it("should respect relevance threshold in context expansion", () => {
    buildLinearGraph();

    const highThreshold = traversal.contextExpansion(["A"], {
      maxNodes: 10,
      maxDepth: 5,
      relevanceThreshold: 0.9,
    });

    const lowThreshold = traversal.contextExpansion(["A"], {
      maxNodes: 10,
      maxDepth: 5,
      relevanceThreshold: 0.01,
    });

    // Higher threshold should yield fewer nodes
    expect(highThreshold.nodes.length).toBeLessThanOrEqual(lowThreshold.nodes.length);
  });

  // --- PageRank ---

  it("should compute relevance scores", () => {
    buildDiamondGraph();

    const scores = traversal.computeRelevanceScores(20, 0.85);
    expect(scores.size).toBe(4);

    // D should have highest score (most incoming links)
    const dScore = scores.get("D") ?? 0;
    const aScore = scores.get("A") ?? 0;
    expect(dScore).toBeGreaterThan(aScore);
  });

  it("should handle empty graph for PageRank", () => {
    const scores = traversal.computeRelevanceScores();
    expect(scores.size).toBe(0);
  });

  // --- Clusters ---

  it("should find clusters in disconnected components", () => {
    // Component 1: A -> B
    graph.addNode(node("A", NodeType.Account));
    graph.addNode(node("B", NodeType.Category));
    graph.addEdge(edge("e1", "A", "B"));

    // Component 2: C -> D
    graph.addNode(node("C", NodeType.Budget));
    graph.addNode(node("D", NodeType.Goal));
    graph.addEdge(edge("e2", "C", "D"));

    const clusters = traversal.findClusters();
    expect(clusters.size).toBeGreaterThanOrEqual(2);
  });

  // --- k-Hop Neighborhood ---

  it("should get k-hop neighborhood", () => {
    buildLinearGraph();

    const oneHop = traversal.kHopNeighborhood("A", 1);
    expect(oneHop.nodes.length).toBe(2); // A + B

    const twoHop = traversal.kHopNeighborhood("A", 2);
    expect(twoHop.nodes.length).toBe(3); // A + B + C

    const threeHop = traversal.kHopNeighborhood("A", 3);
    expect(threeHop.nodes.length).toBe(4); // All nodes
  });
});
