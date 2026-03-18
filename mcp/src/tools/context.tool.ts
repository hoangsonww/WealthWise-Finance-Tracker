import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  KnowledgeGraph,
  KnowledgeBase,
  GraphTraversal,
  GraphQueryEngine,
  ContextEngine,
  IngestionPipeline,
  NodeType,
} from "@wealthwise/context-engineering";
import { McpToolError } from "../utils/errors";
import { logger } from "../utils/logger";

// Cache per-user graphs
interface UserContextCache {
  graph: KnowledgeGraph;
  knowledgeBase: KnowledgeBase;
  engine: ContextEngine;
  lastRefresh: number;
}

const userContextCache = new Map<string, UserContextCache>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getOrBuildContext(userId: string, mongoUri: string): Promise<UserContextCache> {
  const cached = userContextCache.get(userId);
  if (cached && Date.now() - cached.lastRefresh < CACHE_TTL) return cached;

  const pipeline = new IngestionPipeline(mongoUri);
  const { graph, knowledgeBase } = await pipeline.ingest(userId);
  await pipeline.disconnect();

  const engine = new ContextEngine(graph, knowledgeBase);
  const entry: UserContextCache = { graph, knowledgeBase, engine, lastRefresh: Date.now() };
  userContextCache.set(userId, entry);
  return entry;
}

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function getMongoUri(): string {
  return process.env.MONGODB_URI ?? "mongodb://localhost:27017/wealthwise";
}

export function registerContextTools(server: McpServer, getUserId: () => string): void {
  // 1. Build/refresh knowledge graph for current user
  server.tool(
    "build_knowledge_graph",
    "Build or refresh the financial knowledge graph from user data. This creates nodes (accounts, transactions, budgets, goals, categories, merchants) and edges (relationships between financial entities) that enable context-aware AI responses.",
    {},
    async () => {
      const userId = getUserId();
      const mongoUri = getMongoUri();

      // Force refresh by deleting cache
      userContextCache.delete(userId);
      const { graph } = await getOrBuildContext(userId, mongoUri);
      const stats = graph.getStats();

      return textResult({
        message: "Knowledge graph built successfully",
        stats: {
          totalNodes: stats.totalNodes,
          totalEdges: stats.totalEdges,
          nodesByType: stats.nodesByType,
          density: stats.density,
          connectedComponents: stats.connectedComponents,
        },
      });
    }
  );

  // 2. Query knowledge graph
  server.tool(
    "query_knowledge_graph",
    "Query the financial knowledge graph to find related entities and their relationships. Useful for understanding how financial elements are connected (e.g., which accounts fund which goals, which categories are over budget).",
    {
      nodeType: z
        .enum([...Object.values(NodeType)] as [string, ...string[]])
        .optional()
        .describe("Filter by node type"),
      startNodeId: z.string().optional().describe("Start traversal from this node"),
      maxDepth: z.number().min(1).max(5).optional().describe("Maximum traversal depth (1-5)"),
      limit: z.number().min(1).max(100).optional().describe("Maximum results"),
    },
    async (params) => {
      const userId = getUserId();
      const mongoUri = getMongoUri();
      const { graph } = await getOrBuildContext(userId, mongoUri);
      const queryEngine = new GraphQueryEngine(graph);

      const result = queryEngine.execute([
        {
          type: "match",
          params: {
            nodeType: params.nodeType,
            startNodeId: params.startNodeId,
            maxDepth: params.maxDepth ?? 2,
            limit: params.limit ?? 20,
          },
        },
      ]);

      return textResult({
        nodes: result.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          properties: n.properties,
        })),
        edges: result.edges.map((e) => ({
          source: e.source,
          target: e.target,
          type: e.type,
          weight: e.weight,
        })),
        metadata: result.metadata,
      });
    }
  );

  // 3. Get related entities for a specific node
  server.tool(
    "get_related_entities",
    "Find all entities related to a specific financial entity (account, transaction, budget, goal, etc.) via the knowledge graph. Shows direct relationships and their types.",
    {
      nodeId: z.string().describe("The ID of the entity to find relations for"),
      depth: z.number().min(1).max(3).optional().describe("Relationship depth (default 1)"),
    },
    async (params) => {
      const userId = getUserId();
      const mongoUri = getMongoUri();
      const { graph } = await getOrBuildContext(userId, mongoUri);
      const queryEngine = new GraphQueryEngine(graph);

      const result = queryEngine.getRelatedEntities(params.nodeId, params.depth ?? 1);

      return textResult({
        centerNode: result.nodes.find((n) => n.id === params.nodeId),
        relatedNodes: result.nodes
          .filter((n) => n.id !== params.nodeId)
          .map((n) => ({
            id: n.id,
            type: n.type,
            label: n.label,
            properties: n.properties,
          })),
        relationships: result.edges.map((e) => ({
          from: e.source,
          to: e.target,
          type: e.type,
          weight: e.weight,
        })),
      });
    }
  );

  // 4. Find path between two financial entities
  server.tool(
    "find_financial_path",
    "Find the relationship path between two financial entities in the knowledge graph. Useful for understanding indirect connections (e.g., how a specific transaction relates to a savings goal).",
    {
      startId: z.string().describe("Starting entity ID"),
      endId: z.string().describe("Target entity ID"),
    },
    async (params) => {
      const userId = getUserId();
      const mongoUri = getMongoUri();
      const { graph } = await getOrBuildContext(userId, mongoUri);
      const traversal = new GraphTraversal(graph);

      const path = traversal.shortestPath(params.startId, params.endId);

      if (!path) {
        return textResult({ message: "No path found between the specified entities" });
      }

      return textResult({
        path: {
          length: path.length,
          totalWeight: path.totalWeight,
          nodes: path.nodes.map((n) => ({ id: n.id, type: n.type, label: n.label })),
          edges: path.edges.map((e) => ({ type: e.type, weight: e.weight })),
        },
      });
    }
  );

  // 5. Search knowledge base for financial rules/tips
  server.tool(
    "search_financial_knowledge",
    "Search the financial knowledge base for rules, tips, and best practices. Returns relevant financial advice based on the query, with BM25 relevance scoring.",
    {
      query: z
        .string()
        .describe("Search query (e.g., 'emergency fund', 'budget optimization', 'debt payoff')"),
      limit: z.number().min(1).max(20).optional().describe("Max results (default 5)"),
      category: z
        .string()
        .optional()
        .describe("Filter by category (budgeting_strategy, savings_tip, debt_management, etc.)"),
    },
    async (params) => {
      const userId = getUserId();
      const mongoUri = getMongoUri();
      const { knowledgeBase } = await getOrBuildContext(userId, mongoUri);

      const results = knowledgeBase.search(params.query, {
        limit: params.limit ?? 5,
        category: params.category as Parameters<typeof knowledgeBase.search>[1] extends
          | { category?: infer C }
          | undefined
          ? C
          : never,
      });

      return textResult({
        query: params.query,
        results: results.map((r) => ({
          title: r.entry.title,
          content: r.entry.content,
          category: r.entry.category,
          relevanceScore: r.score,
          tags: r.entry.tags,
        })),
      });
    }
  );

  // 6. Get financial context for agent
  server.tool(
    "get_financial_context",
    "Retrieve assembled financial context optimized for AI agent consumption. Combines knowledge graph data, financial rules, and user data into a structured context window.",
    {
      intent: z
        .enum([
          "financial-advice",
          "anomaly-detection",
          "budget-optimization",
          "forecasting",
          "general",
        ])
        .describe("The type of analysis being performed"),
      query: z.string().optional().describe("Optional specific query for context relevance"),
    },
    async (params) => {
      const userId = getUserId();
      const mongoUri = getMongoUri();
      const { engine } = await getOrBuildContext(userId, mongoUri);

      const contextWindow = engine.assembleContext({
        userId,
        agentType: params.intent,
        userMessage: params.query ?? "",
      });

      return textResult({
        context: {
          graphContext: contextWindow.graphContext,
          knowledgeContext: contextWindow.knowledgeContext,
          totalTokens: contextWindow.totalTokens,
          components: contextWindow.metadata.components.map((c) => ({
            name: c.name,
            tokenCount: c.tokenCount,
            priority: c.priority,
          })),
        },
      });
    }
  );

  // 7. Get graph statistics
  server.tool(
    "get_graph_statistics",
    "Get statistics about the user's financial knowledge graph, including node/edge counts by type, graph density, and most connected entities.",
    {},
    async () => {
      const userId = getUserId();
      const mongoUri = getMongoUri();
      const { graph } = await getOrBuildContext(userId, mongoUri);
      const stats = graph.getStats();

      return textResult({
        stats: {
          totalNodes: stats.totalNodes,
          totalEdges: stats.totalEdges,
          density: stats.density,
          connectedComponents: stats.connectedComponents,
          averageDegree: stats.averageDegree,
          nodesByType: stats.nodesByType,
          edgesByType: stats.edgesByType,
          topNodesByDegree: stats.topNodesByDegree,
        },
      });
    }
  );

  // 8. Get entity clusters
  server.tool(
    "get_financial_clusters",
    "Identify clusters of related financial entities using graph analysis. Useful for understanding spending patterns, related goals, and financial entity groupings.",
    {},
    async () => {
      const userId = getUserId();
      const mongoUri = getMongoUri();
      const { graph } = await getOrBuildContext(userId, mongoUri);
      const traversal = new GraphTraversal(graph);

      const clusters = traversal.findClusters();

      const clusterDetails = Object.entries(Object.fromEntries(clusters)).map(
        ([clusterId, nodeIds]) => ({
          clusterId,
          size: (nodeIds as string[]).length,
          nodes: (nodeIds as string[]).slice(0, 10).map((id) => {
            const node = graph.getNode(id);
            return node
              ? { id: node.id, type: node.type, label: node.label }
              : { id, type: "unknown", label: "unknown" };
          }),
        })
      );

      return textResult({
        totalClusters: clusterDetails.length,
        clusters: clusterDetails.sort((a, b) => b.size - a.size),
      });
    }
  );
}
