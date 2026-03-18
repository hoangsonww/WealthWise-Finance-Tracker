import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jsonwebtoken from "jsonwebtoken";
import { logger } from "./utils/logger";
import { KnowledgeGraph } from "./graph/knowledge-graph";
import { GraphTraversal } from "./graph/traversal";
import { GraphQueryEngine } from "./graph/query";
import { GraphBuilder } from "./graph/builder";
import { KnowledgeBase } from "./knowledge-base/knowledge-base";
import { ContextRetriever } from "./knowledge-base/retriever";
import { getFinancialKnowledgeEntries } from "./knowledge-base/financial-rules";
import { ContextEngine } from "./context/context-engine";
import { PromptAssembler } from "./context/prompt-assembler";
import { IngestionPipeline } from "./ingestion/pipeline";
import { createGraphRoutes } from "./ui/routes/graph.routes";
import { NodeType, EdgeType } from "./graph/types";

// --- Public API Exports ---
export { KnowledgeGraph } from "./graph/knowledge-graph";
export { GraphTraversal } from "./graph/traversal";
export { GraphQueryEngine, QueryBuilder } from "./graph/query";
export { GraphBuilder } from "./graph/builder";
export { KnowledgeBase } from "./knowledge-base/knowledge-base";
export { ContextRetriever } from "./knowledge-base/retriever";
export { getFinancialKnowledgeEntries } from "./knowledge-base/financial-rules";
export { ContextEngine } from "./context/context-engine";
export { PromptAssembler } from "./context/prompt-assembler";
export { IngestionPipeline } from "./ingestion/pipeline";
export { connectDatabase, disconnectDatabase } from "./db/connection";
export { logger } from "./utils/logger";

export {
  NodeType,
  EdgeType,
  TraversalStrategy,
  GraphNode,
  GraphEdge,
  GraphQuery,
  GraphQueryResult,
  GraphPath,
  GraphStats,
  NodeProperties,
  NodeMetadata,
  EdgeProperties,
} from "./graph/types";

export {
  KnowledgeEntry,
  KnowledgeCategory,
  SearchResult,
  KnowledgeBaseStats,
} from "./knowledge-base/types";

export { ContextWindow, ContextConfig, ContextComponent } from "./context/types";

export { RetrievalResult, RetrievalOptions } from "./knowledge-base/retriever";

// --- HTTP Server ---

interface AuthRequest extends Request {
  userId?: string;
}

// In-memory stores per user
const userGraphs = new Map<string, KnowledgeGraph>();
const userKbs = new Map<string, KnowledgeBase>();

function getOrCreateKB(userId: string): KnowledgeBase {
  if (!userKbs.has(userId)) {
    const kb = new KnowledgeBase();
    const entries = getFinancialKnowledgeEntries();
    for (const entry of entries) {
      kb.addEntry(entry);
    }
    userKbs.set(userId, kb);
  }
  return userKbs.get(userId)!;
}

function getOrCreateGraph(userId: string): KnowledgeGraph {
  if (!userGraphs.has(userId)) {
    userGraphs.set(userId, new KnowledgeGraph());
  }
  return userGraphs.get(userId)!;
}

/**
 * Start the context engineering HTTP server.
 */
export function createApp(): express.Application {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // JWT auth middleware (optional - skips if no auth header)
  const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // For dev/demo, use a default userId
      req.userId = "demo-user";
      next();
      return;
    }

    const token = authHeader.substring(7);
    try {
      const secret = process.env.JWT_SECRET ?? "development-secret-that-is-at-least-32-chars";
      const decoded = jsonwebtoken.verify(token, secret) as {
        userId: string;
      };
      req.userId = decoded.userId;
      next();
    } catch {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid token" },
      });
    }
  };

  // --- Health check ---
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        service: "context-engineering",
        status: "healthy",
        timestamp: new Date().toISOString(),
        activeUsers: userGraphs.size,
      },
    });
  });

  // --- Graph Stats ---
  app.get("/api/v1/graph/stats", authMiddleware, (req: AuthRequest, res: Response) => {
    const graph = getOrCreateGraph(req.userId!);
    const stats = graph.getStats();
    res.json({ success: true, data: stats });
  });

  // --- Graph Data (full JSON) ---
  app.get("/api/v1/graph/data", authMiddleware, (req: AuthRequest, res: Response) => {
    const graph = getOrCreateGraph(req.userId!);
    const data = graph.toJSON();
    res.json({
      success: true,
      data: {
        nodes: data.nodes,
        edges: data.edges,
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length,
      },
    });
  });

  // --- Graph Nodes by Type ---
  app.get("/api/v1/graph/nodes/:type", authMiddleware, (req: AuthRequest, res: Response) => {
    const graph = getOrCreateGraph(req.userId!);
    const nodeType = req.params.type as NodeType;

    if (!Object.values(NodeType).includes(nodeType)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_NODE_TYPE",
          message: `Invalid node type: ${nodeType}`,
        },
      });
      return;
    }

    const nodes = graph.getNodesByType(nodeType);
    res.json({ success: true, data: { nodes, count: nodes.length } });
  });

  // --- Graph Query ---
  app.post("/api/v1/graph/query", authMiddleware, (req: AuthRequest, res: Response) => {
    const graph = getOrCreateGraph(req.userId!);
    const queryEngine = new GraphQueryEngine(graph);

    const { startNodeId, startNodeType, edgeTypes, targetNodeTypes, maxDepth, limit } = req.body;

    const result = graph.query({
      startNodeId,
      startNodeType,
      edgeTypes,
      targetNodeTypes,
      maxDepth: maxDepth ?? 3,
      limit: limit ?? 50,
    });

    res.json({ success: true, data: result });
  });

  // --- Context Retrieval ---
  app.post("/api/v1/context/retrieve", authMiddleware, (req: AuthRequest, res: Response) => {
    const graph = getOrCreateGraph(req.userId!);
    const kb = getOrCreateKB(req.userId!);
    const retriever = new ContextRetriever(graph, kb);

    const { intent, options } = req.body;

    if (!intent) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_INTENT",
          message: "intent field is required",
        },
      });
      return;
    }

    const result = retriever.retrieve(req.userId!, intent, options);
    res.json({ success: true, data: result });
  });

  // --- Context Assembly (full context window) ---
  app.post("/api/v1/context/assemble", authMiddleware, (req: AuthRequest, res: Response) => {
    const graph = getOrCreateGraph(req.userId!);
    const kb = getOrCreateKB(req.userId!);
    const engine = new ContextEngine(graph, kb);

    const { agentType, userMessage, conversationHistory, additionalContext } = req.body;

    if (!agentType || !userMessage) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "agentType and userMessage are required",
        },
      });
      return;
    }

    const window = engine.assembleContext({
      userId: req.userId!,
      agentType,
      userMessage,
      conversationHistory,
      additionalContext,
    });

    res.json({ success: true, data: window });
  });

  // --- Knowledge Base Search ---
  app.get("/api/v1/knowledge/search", authMiddleware, (req: AuthRequest, res: Response) => {
    const kb = getOrCreateKB(req.userId!);
    const query = req.query.q as string;

    if (!query) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_QUERY",
          message: "q query parameter is required",
        },
      });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const results = kb.search(query, { limit });
    res.json({ success: true, data: { results, count: results.length } });
  });

  // --- Knowledge Base Stats ---
  app.get("/api/v1/knowledge/stats", authMiddleware, (req: AuthRequest, res: Response) => {
    const kb = getOrCreateKB(req.userId!);
    const stats = kb.getStats();
    res.json({ success: true, data: stats });
  });

  // --- Graph Ingest (build from posted data) ---
  app.post("/api/v1/graph/ingest", authMiddleware, (req: AuthRequest, res: Response) => {
    const graph = getOrCreateGraph(req.userId!);
    const builder = new GraphBuilder(graph, req.userId!);

    const { accounts, transactions, budgets, goals, categories, recurring } = req.body;

    builder.buildFromData({
      accounts: accounts ?? [],
      transactions: transactions ?? [],
      budgets: budgets ?? [],
      goals: goals ?? [],
      categories: categories ?? [],
      recurring: recurring ?? [],
    });

    const stats = graph.getStats();
    res.json({
      success: true,
      data: {
        message: "Graph built successfully",
        stats,
      },
    });
  });

  // --- Graph Clear ---
  app.delete("/api/v1/graph", authMiddleware, (req: AuthRequest, res: Response) => {
    const graph = getOrCreateGraph(req.userId!);
    graph.clear();
    res.json({
      success: true,
      data: { message: "Graph cleared" },
    });
  });

  // --- Knowledge Graph Visualization UI ---
  // Serves D3.js dashboard at /ui and graph API at /ui/data, /ui/stats, etc.
  app.use(
    "/ui",
    authMiddleware,
    (req: AuthRequest, _res: Response, next: NextFunction) => {
      // Ensure graph and KB exist for the UI routes
      getOrCreateGraph(req.userId!);
      getOrCreateKB(req.userId!);
      next();
    },
    (req: AuthRequest, res: Response, next: NextFunction) => {
      const graph = getOrCreateGraph(req.userId!);
      const kb = getOrCreateKB(req.userId!);
      const router = createGraphRoutes(graph, kb);
      router(req, res, next);
    }
  );

  // --- Error handler ---
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ error: err.message, stack: err.stack }, "Unhandled error");
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal error occurred",
      },
    });
  });

  return app;
}

// Start server if this file is the entry point
if (require.main === module) {
  const port = parseInt(process.env.CONTEXT_PORT ?? "5300", 10);
  const app = createApp();
  app.listen(port, () => {
    logger.info({ port }, "Context Engineering server started");
  });
}
