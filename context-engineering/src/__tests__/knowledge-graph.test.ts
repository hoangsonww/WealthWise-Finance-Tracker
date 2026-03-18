import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeGraph } from "../graph/knowledge-graph";
import { GraphNode, GraphEdge, NodeType, EdgeType, NodeMetadata } from "../graph/types";

function createNodeMetadata(userId: string = "test-user"): NodeMetadata {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    updatedAt: now,
    source: "test",
    userId,
    version: 1,
    accessCount: 0,
  };
}

function makeAccountNode(id: string, name: string, balance: number): GraphNode<NodeType.Account> {
  return {
    id,
    type: NodeType.Account,
    label: name,
    properties: {
      name,
      accountType: "checking",
      balance,
      currency: "USD",
      isArchived: false,
    },
    metadata: createNodeMetadata(),
  };
}

function makeCategoryNode(id: string, name: string): GraphNode<NodeType.Category> {
  return {
    id,
    type: NodeType.Category,
    label: name,
    properties: {
      name,
      isSystem: true,
      transactionCount: 0,
      totalSpent: 0,
    },
    metadata: createNodeMetadata(),
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  type: EdgeType,
  weight: number = 0.8
): GraphEdge {
  const now = new Date().toISOString();
  return {
    id,
    source,
    target,
    type,
    weight,
    properties: { label: "test edge" },
    metadata: {
      createdAt: now,
      updatedAt: now,
      source: "test",
      userId: "test-user",
    },
  };
}

describe("KnowledgeGraph", () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  // --- Node CRUD ---

  it("should add and retrieve a node", () => {
    const node = makeAccountNode("acc:1", "Checking", 1000);
    graph.addNode(node);

    expect(graph.hasNode("acc:1")).toBe(true);
    expect(graph.nodeCount).toBe(1);

    const retrieved = graph.getNode("acc:1");
    expect(retrieved).toBeDefined();
    expect(retrieved!.label).toBe("Checking");
    expect(retrieved!.metadata.accessCount).toBe(1);
  });

  it("should return undefined for non-existent node", () => {
    expect(graph.getNode("nonexistent")).toBeUndefined();
  });

  it("should update a node", () => {
    const node = makeAccountNode("acc:1", "Checking", 1000);
    graph.addNode(node);

    const updated = graph.updateNode("acc:1", {
      label: "Updated Checking",
    });

    expect(updated).toBe(true);
    const retrieved = graph.getNode("acc:1");
    expect(retrieved!.label).toBe("Updated Checking");
    expect(retrieved!.metadata.version).toBe(2);
  });

  it("should return false when updating non-existent node", () => {
    expect(graph.updateNode("nonexistent", { label: "test" })).toBe(false);
  });

  it("should remove a node and its connected edges", () => {
    const n1 = makeAccountNode("acc:1", "Checking", 1000);
    const n2 = makeCategoryNode("cat:1", "Food");
    graph.addNode(n1);
    graph.addNode(n2);

    const edge = makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS);
    graph.addEdge(edge);

    expect(graph.nodeCount).toBe(2);
    expect(graph.edgeCount).toBe(1);

    graph.removeNode("acc:1");

    expect(graph.hasNode("acc:1")).toBe(false);
    expect(graph.nodeCount).toBe(1);
    expect(graph.edgeCount).toBe(0); // Edge should be removed too
  });

  it("should get nodes by type", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeAccountNode("acc:2", "Savings", 5000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));

    const accounts = graph.getNodesByType(NodeType.Account);
    expect(accounts).toHaveLength(2);

    const categories = graph.getNodesByType(NodeType.Category);
    expect(categories).toHaveLength(1);

    const budgets = graph.getNodesByType(NodeType.Budget);
    expect(budgets).toHaveLength(0);
  });

  // --- Edge CRUD ---

  it("should add and retrieve an edge", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));

    const edge = makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS);
    graph.addEdge(edge);

    expect(graph.hasEdge("e1")).toBe(true);
    expect(graph.edgeCount).toBe(1);

    const retrieved = graph.getEdge("e1");
    expect(retrieved).toBeDefined();
    expect(retrieved!.source).toBe("acc:1");
    expect(retrieved!.target).toBe("cat:1");
  });

  it("should get edges between two nodes", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));

    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e2", "acc:1", "cat:1", EdgeType.BUDGET_FOR_CATEGORY));

    const edges = graph.getEdgesBetween("acc:1", "cat:1");
    expect(edges).toHaveLength(2);
  });

  it("should get outgoing and incoming edges", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));
    graph.addNode(makeCategoryNode("cat:2", "Transport"));

    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e2", "acc:1", "cat:2", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e3", "cat:1", "acc:1", EdgeType.BUDGET_FOR_ACCOUNT));

    const outgoing = graph.getOutgoingEdges("acc:1");
    expect(outgoing).toHaveLength(2);

    const incoming = graph.getIncomingEdges("acc:1");
    expect(incoming).toHaveLength(1);
  });

  it("should remove an edge", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));
    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));

    expect(graph.removeEdge("e1")).toBe(true);
    expect(graph.edgeCount).toBe(0);
    expect(graph.removeEdge("e1")).toBe(false);
  });

  // --- Neighbor operations ---

  it("should get neighbors with direction filtering", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));
    graph.addNode(makeCategoryNode("cat:2", "Transport"));

    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e2", "cat:2", "acc:1", EdgeType.BUDGET_FOR_ACCOUNT));

    const outNeighbors = graph.getNeighbors("acc:1", {
      direction: "outgoing",
    });
    expect(outNeighbors).toHaveLength(1);
    expect(outNeighbors[0].id).toBe("cat:1");

    const inNeighbors = graph.getNeighbors("acc:1", {
      direction: "incoming",
    });
    expect(inNeighbors).toHaveLength(1);
    expect(inNeighbors[0].id).toBe("cat:2");

    const allNeighbors = graph.getNeighbors("acc:1", {
      direction: "both",
    });
    expect(allNeighbors).toHaveLength(2);
  });

  it("should get neighbors filtered by edge type", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));
    graph.addNode(makeCategoryNode("cat:2", "Transport"));

    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e2", "acc:1", "cat:2", EdgeType.BUDGET_FOR_CATEGORY));

    const filtered = graph.getNeighbors("acc:1", {
      edgeTypes: [EdgeType.CATEGORIZED_AS],
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("cat:1");
  });

  it("should calculate node degree", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));
    graph.addNode(makeCategoryNode("cat:2", "Transport"));

    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e2", "acc:1", "cat:2", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e3", "cat:1", "acc:1", EdgeType.BUDGET_FOR_ACCOUNT));

    expect(graph.getDegree("acc:1", "outgoing")).toBe(2);
    expect(graph.getDegree("acc:1", "incoming")).toBe(1);
    expect(graph.getDegree("acc:1", "both")).toBe(3);
  });

  // --- Query ---

  it("should query the graph with BFS traversal", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));
    graph.addNode(makeCategoryNode("cat:2", "Transport"));

    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e2", "acc:1", "cat:2", EdgeType.CATEGORIZED_AS));

    const result = graph.query({
      startNodeId: "acc:1",
      maxDepth: 1,
    });

    expect(result.nodes.length).toBeGreaterThanOrEqual(2);
    expect(result.edges.length).toBeGreaterThanOrEqual(1);
    expect(result.metadata.queryTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("should find paths between nodes", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));
    graph.addNode(makeCategoryNode("cat:2", "Transport"));

    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e2", "cat:1", "cat:2", EdgeType.SUBCATEGORY_OF));

    const paths = graph.findPaths("acc:1", "cat:2", 3);
    expect(paths.length).toBeGreaterThanOrEqual(1);
    expect(paths[0].nodes[0].id).toBe("acc:1");
    expect(paths[0].nodes[paths[0].nodes.length - 1].id).toBe("cat:2");
  });

  it("should return empty paths for disconnected nodes", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));
    // No edges connecting them

    const paths = graph.findPaths("acc:1", "cat:1", 3);
    expect(paths).toHaveLength(0);
  });

  // --- Subgraph ---

  it("should extract a subgraph", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeAccountNode("acc:2", "Savings", 5000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));

    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e2", "acc:2", "cat:1", EdgeType.CATEGORIZED_AS));

    const sub = graph.getSubgraph(["acc:1", "cat:1"]);
    expect(sub.nodes).toHaveLength(2);
    expect(sub.edges).toHaveLength(1); // Only e1 connects acc:1 to cat:1
  });

  // --- Search ---

  it("should search nodes by label", () => {
    graph.addNode(makeAccountNode("acc:1", "Main Checking Account", 1000));
    graph.addNode(makeAccountNode("acc:2", "Emergency Savings", 5000));
    graph.addNode(makeCategoryNode("cat:1", "Food & Dining"));

    const results = graph.searchByLabel("checking");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("acc:1");

    const results2 = graph.searchByLabel("FOOD");
    expect(results2).toHaveLength(1);
  });

  it("should search nodes with a predicate", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeAccountNode("acc:2", "Savings", 5000));

    const highBalance = graph.searchNodes((node) => {
      if (node.type !== NodeType.Account) return false;
      const props = node.properties as { balance: number };
      return props.balance > 3000;
    });

    expect(highBalance).toHaveLength(1);
    expect(highBalance[0].id).toBe("acc:2");
  });

  // --- Statistics ---

  it("should compute graph statistics", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeAccountNode("acc:2", "Savings", 5000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));

    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));
    graph.addEdge(makeEdge("e2", "acc:2", "cat:1", EdgeType.CATEGORIZED_AS));

    const stats = graph.getStats();
    expect(stats.totalNodes).toBe(3);
    expect(stats.totalEdges).toBe(2);
    expect(stats.nodesByType[NodeType.Account]).toBe(2);
    expect(stats.nodesByType[NodeType.Category]).toBe(1);
    expect(stats.averageDegree).toBeGreaterThan(0);
    expect(stats.connectedComponents).toBe(1);
    expect(stats.topNodesByDegree.length).toBeGreaterThan(0);
  });

  // --- Serialization ---

  it("should serialize and deserialize the graph", () => {
    graph.addNode(makeAccountNode("acc:1", "Checking", 1000));
    graph.addNode(makeCategoryNode("cat:1", "Food"));
    graph.addEdge(makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS));

    const json = graph.toJSON();
    expect(json.nodes).toHaveLength(2);
    expect(json.edges).toHaveLength(1);

    const restored = KnowledgeGraph.fromJSON(json);
    expect(restored.nodeCount).toBe(2);
    expect(restored.edgeCount).toBe(1);
    expect(restored.hasNode("acc:1")).toBe(true);
    expect(restored.hasEdge("e1")).toBe(true);
  });

  // --- Bulk operations ---

  it("should handle bulk add and clear", () => {
    const nodes = [
      makeAccountNode("acc:1", "A", 100),
      makeAccountNode("acc:2", "B", 200),
      makeCategoryNode("cat:1", "C"),
    ];
    const edges = [
      makeEdge("e1", "acc:1", "cat:1", EdgeType.CATEGORIZED_AS),
      makeEdge("e2", "acc:2", "cat:1", EdgeType.CATEGORIZED_AS),
    ];

    graph.addNodes(nodes);
    graph.addEdges(edges);

    expect(graph.nodeCount).toBe(3);
    expect(graph.edgeCount).toBe(2);

    graph.clear();
    expect(graph.nodeCount).toBe(0);
    expect(graph.edgeCount).toBe(0);
  });

  // --- Edge cases ---

  it("should handle empty graph operations gracefully", () => {
    expect(graph.getNode("nonexistent")).toBeUndefined();
    expect(graph.getEdge("nonexistent")).toBeUndefined();
    expect(graph.removeNode("nonexistent")).toBe(false);
    expect(graph.removeEdge("nonexistent")).toBe(false);
    expect(graph.getNeighbors("nonexistent")).toEqual([]);
    expect(graph.getDegree("nonexistent")).toBe(0);
    expect(graph.getEdgesBetween("a", "b")).toEqual([]);
    expect(graph.findPaths("a", "b")).toEqual([]);
    expect(graph.searchByLabel("anything")).toEqual([]);

    const stats = graph.getStats();
    expect(stats.totalNodes).toBe(0);
    expect(stats.totalEdges).toBe(0);
    expect(stats.averageDegree).toBe(0);
    expect(stats.density).toBe(0);
    expect(stats.connectedComponents).toBe(0);
  });
});
