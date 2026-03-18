import { KnowledgeGraph } from "./knowledge-graph";
import { GraphTraversal } from "./traversal";
import {
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  GraphQueryResult,
  NodeProperties,
} from "./types";

export interface QueryPlan {
  type: "match" | "filter" | "expand" | "aggregate";
  params: Record<string, unknown>;
}

export class GraphQueryEngine {
  private graph: KnowledgeGraph;
  private traversal: GraphTraversal;

  constructor(graph: KnowledgeGraph) {
    this.graph = graph;
    this.traversal = new GraphTraversal(graph);
  }

  /**
   * Start a fluent query builder
   */
  match(nodeType?: NodeType): QueryBuilder {
    return new QueryBuilder(this.graph, this.traversal, nodeType);
  }

  /**
   * Execute a structured query plan
   */
  execute(plans: QueryPlan[]): GraphQueryResult {
    const startTime = Date.now();
    let currentNodes: GraphNode[] = [];
    let currentEdges: GraphEdge[] = [];

    for (const plan of plans) {
      switch (plan.type) {
        case "match": {
          const nodeType = plan.params.nodeType as NodeType | undefined;
          if (nodeType) {
            currentNodes = this.graph.getNodesByType(nodeType);
          } else {
            currentNodes = this.graph.searchNodes(() => true);
          }
          break;
        }
        case "filter": {
          const field = plan.params.field as string;
          const value = plan.params.value;
          const operator = (plan.params.operator as string) ?? "eq";

          currentNodes = currentNodes.filter((node) => {
            const props = node.properties as Record<string, unknown>;
            const fieldValue = props[field];
            switch (operator) {
              case "eq":
                return fieldValue === value;
              case "gt":
                return (
                  typeof fieldValue === "number" && typeof value === "number" && fieldValue > value
                );
              case "lt":
                return (
                  typeof fieldValue === "number" && typeof value === "number" && fieldValue < value
                );
              case "gte":
                return (
                  typeof fieldValue === "number" && typeof value === "number" && fieldValue >= value
                );
              case "lte":
                return (
                  typeof fieldValue === "number" && typeof value === "number" && fieldValue <= value
                );
              case "contains":
                return (
                  typeof fieldValue === "string" &&
                  typeof value === "string" &&
                  fieldValue.toLowerCase().includes(value.toLowerCase())
                );
              default:
                return fieldValue === value;
            }
          });
          break;
        }
        case "expand": {
          const edgeType = plan.params.edgeType as EdgeType | undefined;
          const depth = (plan.params.depth as number) ?? 1;
          const expandedNodes = new Map<string, GraphNode>();
          const expandedEdges = new Map<string, GraphEdge>();

          for (const node of currentNodes) {
            expandedNodes.set(node.id, node);

            const neighborhood = this.traversal.kHopNeighborhood(node.id, depth, {
              edgeTypes: edgeType ? [edgeType] : undefined,
            });

            for (const n of neighborhood.nodes) {
              expandedNodes.set(n.id, n);
            }
            for (const e of neighborhood.edges) {
              expandedEdges.set(e.id, e);
            }
          }

          currentNodes = Array.from(expandedNodes.values());
          currentEdges = Array.from(expandedEdges.values());
          break;
        }
        case "aggregate": {
          // Aggregate doesn't change nodes, just collects related edges
          const nodeIdSet = new Set(currentNodes.map((n) => n.id));
          const aggEdges = new Map<string, GraphEdge>();

          for (const node of currentNodes) {
            const outgoing = this.graph.getOutgoingEdges(node.id);
            for (const edge of outgoing) {
              if (nodeIdSet.has(edge.target)) {
                aggEdges.set(edge.id, edge);
              }
            }
            const incoming = this.graph.getIncomingEdges(node.id);
            for (const edge of incoming) {
              if (nodeIdSet.has(edge.source)) {
                aggEdges.set(edge.id, edge);
              }
            }
          }
          currentEdges = Array.from(aggEdges.values());
          break;
        }
      }
    }

    return {
      nodes: currentNodes,
      edges: currentEdges,
      paths: [],
      metadata: {
        queryTimeMs: Date.now() - startTime,
        totalNodes: currentNodes.length,
        totalEdges: currentEdges.length,
        maxDepthReached: 0,
      },
    };
  }

  // --- Pre-built queries for common financial contexts ---

  getAccountOverview(userId: string): GraphQueryResult {
    const startTime = Date.now();
    const userNodeId = `user:${userId}`;
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeIds = new Set<string>();

    // Get user profile node
    const userNode = this.graph.getNode(userNodeId);
    if (userNode) {
      nodes.push(userNode);
      nodeIds.add(userNode.id);
    }

    // Get all accounts
    const accounts = this.graph.getNodesByType(NodeType.Account);
    for (const account of accounts) {
      if (account.metadata.userId === userId) {
        nodes.push(account);
        nodeIds.add(account.id);
      }
    }

    // Collect edges between collected nodes
    for (const nodeId of nodeIds) {
      const outgoing = this.graph.getOutgoingEdges(nodeId);
      for (const edge of outgoing) {
        if (nodeIds.has(edge.target)) edges.push(edge);
      }
      const incoming = this.graph.getIncomingEdges(nodeId);
      for (const edge of incoming) {
        if (nodeIds.has(edge.source)) edges.push(edge);
      }
    }

    return {
      nodes,
      edges,
      paths: [],
      metadata: {
        queryTimeMs: Date.now() - startTime,
        totalNodes: nodes.length,
        totalEdges: edges.length,
        maxDepthReached: 1,
      },
    };
  }

  getSpendingContext(userId: string, categoryId?: string): GraphQueryResult {
    const startTime = Date.now();
    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();

    // Get expense transactions
    const transactions = this.graph.getNodesByType(NodeType.Transaction);
    for (const tx of transactions) {
      if (tx.metadata.userId !== userId) continue;
      const props = tx.properties as NodeProperties[NodeType.Transaction];
      if (props.type !== "expense") continue;

      // If filtering by category, check if transaction is connected to that category
      if (categoryId) {
        const txEdges = this.graph.getOutgoingEdges(tx.id);
        const matchesCategory = txEdges.some(
          (e) => e.type === EdgeType.CATEGORIZED_AS && e.target === `cat:${categoryId}`
        );
        if (!matchesCategory) continue;
      }

      nodes.set(tx.id, tx);

      // Include connected merchants, categories, time periods
      const outgoing = this.graph.getOutgoingEdges(tx.id);
      for (const edge of outgoing) {
        const target = this.graph.getNode(edge.target);
        if (target) {
          nodes.set(target.id, target);
          edges.set(edge.id, edge);
        }
      }
    }

    // Include categories and budgets
    const categories = this.graph.getNodesByType(NodeType.Category);
    for (const cat of categories) {
      nodes.set(cat.id, cat);
    }

    const budgets = this.graph.getNodesByType(NodeType.Budget);
    for (const budget of budgets) {
      if (budget.metadata.userId === userId) {
        nodes.set(budget.id, budget);
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
      paths: [],
      metadata: {
        queryTimeMs: Date.now() - startTime,
        totalNodes: nodes.size,
        totalEdges: edges.size,
        maxDepthReached: 1,
      },
    };
  }

  getBudgetContext(userId: string): GraphQueryResult {
    const startTime = Date.now();
    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();

    // Get all budgets
    const budgets = this.graph.getNodesByType(NodeType.Budget);
    for (const budget of budgets) {
      if (budget.metadata.userId !== userId) continue;
      nodes.set(budget.id, budget);

      // Get related categories
      const outgoing = this.graph.getOutgoingEdges(budget.id);
      for (const edge of outgoing) {
        const target = this.graph.getNode(edge.target);
        if (target) {
          nodes.set(target.id, target);
          edges.set(edge.id, edge);
        }
      }

      // Get OVER_BUDGET edges
      const allEdges = this.graph.getOutgoingEdges(budget.id);
      for (const edge of allEdges) {
        if (edge.type === EdgeType.OVER_BUDGET) {
          edges.set(edge.id, edge);
        }
      }
    }

    // Include insights about budgets
    const insights = this.graph.getNodesByType(NodeType.Insight);
    for (const insight of insights) {
      const props = insight.properties as NodeProperties[NodeType.Insight];
      if (props.insightType === "budget_warning" && insight.metadata.userId === userId) {
        nodes.set(insight.id, insight);
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
      paths: [],
      metadata: {
        queryTimeMs: Date.now() - startTime,
        totalNodes: nodes.size,
        totalEdges: edges.size,
        maxDepthReached: 2,
      },
    };
  }

  getGoalContext(userId: string): GraphQueryResult {
    const startTime = Date.now();
    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();

    const goals = this.graph.getNodesByType(NodeType.Goal);
    for (const goal of goals) {
      if (goal.metadata.userId !== userId) continue;
      nodes.set(goal.id, goal);

      // Get funded-by relationships
      const outgoing = this.graph.getOutgoingEdges(goal.id);
      for (const edge of outgoing) {
        const target = this.graph.getNode(edge.target);
        if (target) {
          nodes.set(target.id, target);
          edges.set(edge.id, edge);
        }
      }

      const incoming = this.graph.getIncomingEdges(goal.id);
      for (const edge of incoming) {
        const source = this.graph.getNode(edge.source);
        if (source) {
          nodes.set(source.id, source);
          edges.set(edge.id, edge);
        }
      }
    }

    // Include goal-related insights
    const insights = this.graph.getNodesByType(NodeType.Insight);
    for (const insight of insights) {
      const props = insight.properties as NodeProperties[NodeType.Insight];
      if (props.insightType === "goal_progress" && insight.metadata.userId === userId) {
        nodes.set(insight.id, insight);
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
      paths: [],
      metadata: {
        queryTimeMs: Date.now() - startTime,
        totalNodes: nodes.size,
        totalEdges: edges.size,
        maxDepthReached: 2,
      },
    };
  }

  getAnomalyContext(userId: string): GraphQueryResult {
    const startTime = Date.now();
    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();

    // Find high-value transactions (potential anomalies)
    const transactions = this.graph.getNodesByType(NodeType.Transaction);
    const userTxs = transactions.filter((tx) => tx.metadata.userId === userId);

    // Calculate average and std deviation
    const amounts = userTxs.map(
      (tx) => (tx.properties as NodeProperties[NodeType.Transaction]).amount
    );
    if (amounts.length === 0) {
      return {
        nodes: [],
        edges: [],
        paths: [],
        metadata: {
          queryTimeMs: Date.now() - startTime,
          totalNodes: 0,
          totalEdges: 0,
          maxDepthReached: 0,
        },
      };
    }

    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 2 * stdDev;

    for (const tx of userTxs) {
      const props = tx.properties as NodeProperties[NodeType.Transaction];
      if (props.amount > threshold) {
        nodes.set(tx.id, tx);

        // Include context
        const outgoing = this.graph.getOutgoingEdges(tx.id);
        for (const edge of outgoing) {
          const target = this.graph.getNode(edge.target);
          if (target) {
            nodes.set(target.id, target);
            edges.set(edge.id, edge);
          }
        }
      }
    }

    // Include OVER_BUDGET edges
    const budgets = this.graph.getNodesByType(NodeType.Budget);
    for (const budget of budgets) {
      if (budget.metadata.userId !== userId) continue;
      const props = budget.properties as NodeProperties[NodeType.Budget];
      if (props.utilizationPercent > 100) {
        nodes.set(budget.id, budget);
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
      paths: [],
      metadata: {
        queryTimeMs: Date.now() - startTime,
        totalNodes: nodes.size,
        totalEdges: edges.size,
        maxDepthReached: 1,
      },
    };
  }

  getFullFinancialContext(userId: string): GraphQueryResult {
    const startTime = Date.now();
    const userNodeId = `user:${userId}`;

    // Use context expansion from user node
    const result = this.traversal.contextExpansion([userNodeId], {
      maxNodes: 100,
      maxDepth: 3,
      relevanceThreshold: 0.05,
      priorityNodeTypes: [NodeType.Account, NodeType.Budget, NodeType.Goal, NodeType.Insight],
    });

    // If user node doesn't exist, fall back to collecting by userId
    if (result.nodes.length === 0) {
      const allNodes = this.graph.searchNodes((n) => n.metadata.userId === userId);
      const nodeIdSet = new Set(allNodes.map((n) => n.id));
      const allEdges: GraphEdge[] = [];

      for (const node of allNodes) {
        const outgoing = this.graph.getOutgoingEdges(node.id);
        for (const edge of outgoing) {
          if (nodeIdSet.has(edge.target)) allEdges.push(edge);
        }
      }

      return {
        nodes: allNodes.slice(0, 100),
        edges: allEdges,
        paths: [],
        metadata: {
          queryTimeMs: Date.now() - startTime,
          totalNodes: Math.min(allNodes.length, 100),
          totalEdges: allEdges.length,
          maxDepthReached: 0,
        },
      };
    }

    return {
      nodes: result.nodes,
      edges: result.edges,
      paths: [],
      metadata: {
        queryTimeMs: Date.now() - startTime,
        totalNodes: result.nodes.length,
        totalEdges: result.edges.length,
        maxDepthReached: 3,
      },
    };
  }

  getRelatedEntities(nodeId: string, depth: number = 2): GraphQueryResult {
    const startTime = Date.now();

    const result = this.traversal.kHopNeighborhood(nodeId, depth);

    return {
      nodes: result.nodes,
      edges: result.edges,
      paths: [],
      metadata: {
        queryTimeMs: Date.now() - startTime,
        totalNodes: result.nodes.length,
        totalEdges: result.edges.length,
        maxDepthReached: depth,
      },
    };
  }
}

/**
 * Fluent query builder for chaining graph queries.
 */
export class QueryBuilder {
  private graph: KnowledgeGraph;
  private traversal: GraphTraversal;
  private matchNodeType: NodeType | undefined;
  private predicates: Array<(node: GraphNode) => boolean> = [];
  private expansionEdgeType: EdgeType | undefined;
  private expansionTargetType: NodeType | undefined;
  private maxDepthValue: number = 1;
  private limitValue: number = 100;
  private orderByField: string | undefined;
  private orderDirection: "asc" | "desc" = "asc";

  constructor(graph: KnowledgeGraph, traversal: GraphTraversal, nodeType?: NodeType) {
    this.graph = graph;
    this.traversal = traversal;
    this.matchNodeType = nodeType;
  }

  where(predicate: (node: GraphNode) => boolean): QueryBuilder {
    this.predicates.push(predicate);
    return this;
  }

  connected(edgeType?: EdgeType): QueryBuilder {
    this.expansionEdgeType = edgeType;
    return this;
  }

  to(nodeType?: NodeType): QueryBuilder {
    this.expansionTargetType = nodeType;
    return this;
  }

  withDepth(maxDepth: number): QueryBuilder {
    this.maxDepthValue = maxDepth;
    return this;
  }

  limit(n: number): QueryBuilder {
    this.limitValue = n;
    return this;
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryBuilder {
    this.orderByField = field;
    this.orderDirection = direction;
    return this;
  }

  execute(): GraphQueryResult {
    const startTime = Date.now();

    // Step 1: Match initial nodes
    let nodes: GraphNode[];
    if (this.matchNodeType) {
      nodes = this.graph.getNodesByType(this.matchNodeType);
    } else {
      nodes = this.graph.searchNodes(() => true);
    }

    // Step 2: Apply predicates
    for (const predicate of this.predicates) {
      nodes = nodes.filter(predicate);
    }

    // Step 3: Expand if connected() was called
    const allNodes = new Map<string, GraphNode>();
    const allEdges = new Map<string, GraphEdge>();

    for (const node of nodes) {
      allNodes.set(node.id, node);
    }

    if (this.expansionEdgeType !== undefined || this.expansionTargetType !== undefined) {
      for (const node of nodes) {
        const neighbors = this.graph.getNeighbors(node.id, {
          edgeTypes: this.expansionEdgeType ? [this.expansionEdgeType] : undefined,
          nodeTypes: this.expansionTargetType ? [this.expansionTargetType] : undefined,
          direction: "both",
        });

        for (const neighbor of neighbors) {
          allNodes.set(neighbor.id, neighbor);
        }

        // Collect connecting edges
        const outgoing = this.graph.getOutgoingEdges(node.id);
        for (const edge of outgoing) {
          if (allNodes.has(edge.target)) {
            if (!this.expansionEdgeType || edge.type === this.expansionEdgeType) {
              allEdges.set(edge.id, edge);
            }
          }
        }

        const incoming = this.graph.getIncomingEdges(node.id);
        for (const edge of incoming) {
          if (allNodes.has(edge.source)) {
            if (!this.expansionEdgeType || edge.type === this.expansionEdgeType) {
              allEdges.set(edge.id, edge);
            }
          }
        }
      }
    }

    let resultNodes = Array.from(allNodes.values());

    // Step 4: Order by
    if (this.orderByField) {
      const field = this.orderByField;
      const dir = this.orderDirection;
      resultNodes.sort((a, b) => {
        const aProps = a.properties as Record<string, unknown>;
        const bProps = b.properties as Record<string, unknown>;
        const aVal = aProps[field];
        const bVal = bProps[field];

        if (typeof aVal === "number" && typeof bVal === "number") {
          return dir === "asc" ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === "string" && typeof bVal === "string") {
          return dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }

    // Step 5: Limit
    resultNodes = resultNodes.slice(0, this.limitValue);

    // Filter edges to only include those connecting result nodes
    const resultNodeIds = new Set(resultNodes.map((n) => n.id));
    const resultEdges = Array.from(allEdges.values()).filter(
      (e) => resultNodeIds.has(e.source) && resultNodeIds.has(e.target)
    );

    return {
      nodes: resultNodes,
      edges: resultEdges,
      paths: [],
      metadata: {
        queryTimeMs: Date.now() - startTime,
        totalNodes: resultNodes.length,
        totalEdges: resultEdges.length,
        maxDepthReached: this.maxDepthValue,
      },
    };
  }
}
