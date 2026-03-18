import { Router, Request, Response } from "express";
import path from "path";
import { KnowledgeGraph } from "../../graph/knowledge-graph";
import { KnowledgeBase } from "../../knowledge-base/knowledge-base";
import { GraphTraversal } from "../../graph/traversal";
import { GraphQueryEngine } from "../../graph/query";
import { NodeType, EdgeType } from "../../graph/types";
import { KnowledgeCategory } from "../../knowledge-base/types";

/**
 * Create Express router for the Knowledge Graph visualization UI
 * and its supporting API endpoints.
 */
export function createGraphRoutes(graph: KnowledgeGraph, knowledgeBase: KnowledgeBase): Router {
  const router = Router();
  const traversal = new GraphTraversal(graph);
  const queryEngine = new GraphQueryEngine(graph);

  // ------------------------------------------------------------------
  // Serve the UI
  // ------------------------------------------------------------------
  router.get("/", (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  });

  // ------------------------------------------------------------------
  // GET /data — full graph data with optional type filters
  // ------------------------------------------------------------------
  router.get("/data", (req: Request, res: Response) => {
    try {
      const nodeTypeFilter = req.query.nodeTypes as string | undefined;
      const edgeTypeFilter = req.query.edgeTypes as string | undefined;
      const minWeight = req.query.minWeight ? parseFloat(req.query.minWeight as string) : 0;

      const raw = graph.toJSON();
      let nodes = raw.nodes;
      let edges = raw.edges;

      // Filter nodes by type
      if (nodeTypeFilter) {
        const allowedTypes = new Set(nodeTypeFilter.split(",").map((t) => t.trim()));
        nodes = nodes.filter((n) => allowedTypes.has(n.type));
      }

      // Filter edges by type
      if (edgeTypeFilter) {
        const allowedEdgeTypes = new Set(edgeTypeFilter.split(",").map((t) => t.trim()));
        edges = edges.filter((e) => allowedEdgeTypes.has(e.type));
      }

      // Filter edges by weight
      if (minWeight > 0) {
        edges = edges.filter((e) => e.weight >= minWeight);
      }

      // Ensure edges only reference present nodes
      const nodeIds = new Set(nodes.map((n) => n.id));
      edges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

      res.json({
        success: true,
        data: {
          nodes,
          edges,
          nodeCount: nodes.length,
          edgeCount: edges.length,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "GRAPH_DATA_ERROR",
          message: err instanceof Error ? err.message : "Failed to retrieve graph data",
        },
      });
    }
  });

  // ------------------------------------------------------------------
  // GET /stats — graph statistics
  // ------------------------------------------------------------------
  router.get("/stats", (_req: Request, res: Response) => {
    try {
      const stats = graph.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "GRAPH_STATS_ERROR",
          message: err instanceof Error ? err.message : "Failed to compute stats",
        },
      });
    }
  });

  // ------------------------------------------------------------------
  // POST /query — execute a graph query
  // ------------------------------------------------------------------
  router.post("/query", (req: Request, res: Response) => {
    try {
      const { startNodeId, startNodeType, edgeTypes, targetNodeTypes, maxDepth, minWeight, limit } =
        req.body;

      // Validate node type if provided
      if (startNodeType && !Object.values(NodeType).includes(startNodeType as NodeType)) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_NODE_TYPE",
            message: `Invalid startNodeType: ${startNodeType}`,
          },
        });
        return;
      }

      // Validate edge types if provided
      if (edgeTypes && Array.isArray(edgeTypes)) {
        const invalidEdge = edgeTypes.find(
          (et: string) => !Object.values(EdgeType).includes(et as EdgeType)
        );
        if (invalidEdge) {
          res.status(400).json({
            success: false,
            error: {
              code: "INVALID_EDGE_TYPE",
              message: `Invalid edge type: ${invalidEdge}`,
            },
          });
          return;
        }
      }

      const result = graph.query({
        startNodeId,
        startNodeType: startNodeType as NodeType | undefined,
        edgeTypes: edgeTypes as EdgeType[] | undefined,
        targetNodeTypes: targetNodeTypes as NodeType[] | undefined,
        maxDepth: maxDepth ?? 3,
        minWeight: minWeight ?? 0,
        limit: limit ?? 100,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "QUERY_ERROR",
          message: err instanceof Error ? err.message : "Query execution failed",
        },
      });
    }
  });

  // ------------------------------------------------------------------
  // GET /node/:id — single node with connected edges
  // ------------------------------------------------------------------
  router.get("/node/:id", (req: Request, res: Response) => {
    try {
      const node = graph.getNode(req.params.id);
      if (!node) {
        res.status(404).json({
          success: false,
          error: {
            code: "NODE_NOT_FOUND",
            message: `Node not found: ${req.params.id}`,
          },
        });
        return;
      }

      const outgoing = graph.getOutgoingEdges(node.id);
      const incoming = graph.getIncomingEdges(node.id);
      const degree = graph.getDegree(node.id, "both");

      res.json({
        success: true,
        data: {
          node,
          outgoingEdges: outgoing,
          incomingEdges: incoming,
          degree,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "NODE_FETCH_ERROR",
          message: err instanceof Error ? err.message : "Failed to fetch node",
        },
      });
    }
  });

  // ------------------------------------------------------------------
  // GET /node/:id/neighbors — neighbors with optional depth
  // ------------------------------------------------------------------
  router.get("/node/:id/neighbors", (req: Request, res: Response) => {
    try {
      const nodeId = req.params.id;
      if (!graph.hasNode(nodeId)) {
        res.status(404).json({
          success: false,
          error: {
            code: "NODE_NOT_FOUND",
            message: `Node not found: ${nodeId}`,
          },
        });
        return;
      }

      const depth = req.query.depth ? parseInt(req.query.depth as string, 10) : 1;
      const clampedDepth = Math.max(1, Math.min(depth, 5));

      const neighborhood = traversal.kHopNeighborhood(nodeId, clampedDepth);

      res.json({
        success: true,
        data: {
          centerNodeId: nodeId,
          depth: clampedDepth,
          nodes: neighborhood.nodes,
          edges: neighborhood.edges,
          nodeCount: neighborhood.nodes.length,
          edgeCount: neighborhood.edges.length,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "NEIGHBOR_ERROR",
          message: err instanceof Error ? err.message : "Failed to fetch neighbors",
        },
      });
    }
  });

  // ------------------------------------------------------------------
  // GET /path/:startId/:endId — shortest path between two nodes
  // ------------------------------------------------------------------
  router.get("/path/:startId/:endId", (req: Request, res: Response) => {
    try {
      const { startId, endId } = req.params;

      if (!graph.hasNode(startId)) {
        res.status(404).json({
          success: false,
          error: {
            code: "NODE_NOT_FOUND",
            message: `Start node not found: ${startId}`,
          },
        });
        return;
      }
      if (!graph.hasNode(endId)) {
        res.status(404).json({
          success: false,
          error: {
            code: "NODE_NOT_FOUND",
            message: `End node not found: ${endId}`,
          },
        });
        return;
      }

      const path = traversal.shortestPath(startId, endId);

      if (!path) {
        res.json({
          success: true,
          data: {
            found: false,
            message: `No path found between ${startId} and ${endId}`,
            nodes: [],
            edges: [],
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          found: true,
          nodes: path.nodes,
          edges: path.edges,
          totalWeight: path.totalWeight,
          length: path.length,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "PATH_ERROR",
          message: err instanceof Error ? err.message : "Path finding failed",
        },
      });
    }
  });

  // ------------------------------------------------------------------
  // GET /clusters — node clusters via label propagation
  // ------------------------------------------------------------------
  router.get("/clusters", (_req: Request, res: Response) => {
    try {
      const clusterMap = traversal.findClusters();

      // Convert Map<string, string[]> to a serializable object
      const clusters: Record<string, string[]> = {};
      for (const [label, nodeIds] of clusterMap) {
        clusters[label] = nodeIds;
      }

      // Enrich with node labels for the largest clusters
      const clusterSummary = Object.entries(clusters)
        .map(([label, nodeIds]) => {
          const representative = graph.getNode(label);
          return {
            clusterId: label,
            representativeLabel: representative?.label ?? label,
            representativeType: representative?.type ?? "unknown",
            size: nodeIds.length,
            nodeIds,
          };
        })
        .sort((a, b) => b.size - a.size);

      res.json({
        success: true,
        data: {
          totalClusters: clusterSummary.length,
          clusters: clusterSummary,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "CLUSTER_ERROR",
          message: err instanceof Error ? err.message : "Cluster computation failed",
        },
      });
    }
  });

  // ------------------------------------------------------------------
  // GET /knowledge — search knowledge base
  // ------------------------------------------------------------------
  router.get("/knowledge", (req: Request, res: Response) => {
    try {
      const query = req.query.q as string | undefined;
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
      const categoryParam = req.query.category as string | undefined;

      let category: KnowledgeCategory | undefined;
      if (categoryParam) {
        if (Object.values(KnowledgeCategory).includes(categoryParam as KnowledgeCategory)) {
          category = categoryParam as KnowledgeCategory;
        } else {
          res.status(400).json({
            success: false,
            error: {
              code: "INVALID_CATEGORY",
              message: `Invalid category: ${categoryParam}`,
            },
          });
          return;
        }
      }

      const results = knowledgeBase.search(query, {
        limit: Math.max(1, Math.min(limit, 50)),
        category,
      });

      res.json({
        success: true,
        data: {
          results,
          count: results.length,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "SEARCH_ERROR",
          message: err instanceof Error ? err.message : "Knowledge search failed",
        },
      });
    }
  });

  // ------------------------------------------------------------------
  // GET /knowledge/stats — knowledge base statistics
  // ------------------------------------------------------------------
  router.get("/knowledge/stats", (_req: Request, res: Response) => {
    try {
      const stats = knowledgeBase.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "KB_STATS_ERROR",
          message: err instanceof Error ? err.message : "Failed to retrieve knowledge base stats",
        },
      });
    }
  });

  // ------------------------------------------------------------------
  // GET /knowledge/:id — single knowledge entry
  // ------------------------------------------------------------------
  router.get("/knowledge/:id", (req: Request, res: Response) => {
    try {
      const entry = knowledgeBase.getEntry(req.params.id);
      if (!entry) {
        res.status(404).json({
          success: false,
          error: {
            code: "ENTRY_NOT_FOUND",
            message: `Knowledge entry not found: ${req.params.id}`,
          },
        });
        return;
      }

      res.json({ success: true, data: entry });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "ENTRY_FETCH_ERROR",
          message: err instanceof Error ? err.message : "Failed to fetch knowledge entry",
        },
      });
    }
  });

  return router;
}
