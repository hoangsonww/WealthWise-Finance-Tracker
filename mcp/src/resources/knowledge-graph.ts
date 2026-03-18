import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { KnowledgeGraph, KnowledgeBase, IngestionPipeline } from "@wealthwise/context-engineering";
import { logger } from "../utils/logger";

// Cache per-user graphs for resources
interface ResourceCache {
  graph: KnowledgeGraph;
  knowledgeBase: KnowledgeBase;
  lastRefresh: number;
}

const resourceCache = new Map<string, ResourceCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getOrBuild(userId: string): Promise<ResourceCache> {
  const cached = resourceCache.get(userId);
  if (cached && Date.now() - cached.lastRefresh < CACHE_TTL) return cached;

  const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/wealthwise";
  const pipeline = new IngestionPipeline(mongoUri);
  const result = await pipeline.ingest(userId);
  await pipeline.disconnect();

  const entry: ResourceCache = { ...result, lastRefresh: Date.now() };
  resourceCache.set(userId, entry);
  return entry;
}

export function registerKnowledgeGraphResource(server: McpServer, getUserId: () => string): void {
  // Resource: Knowledge graph summary
  server.resource(
    "knowledge_graph",
    "wealthwise://knowledge-graph",
    "Financial knowledge graph with entity nodes, relationships, and graph statistics",
    async (uri) => {
      const userId = getUserId();

      try {
        const { graph } = await getOrBuild(userId);
        const stats = graph.getStats();
        const data = graph.toJSON();

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(
                {
                  stats,
                  summary: {
                    accounts: data.nodes.filter((n) => n.type === "account").length,
                    transactions: data.nodes.filter((n) => n.type === "transaction").length,
                    budgets: data.nodes.filter((n) => n.type === "budget").length,
                    goals: data.nodes.filter((n) => n.type === "goal").length,
                    categories: data.nodes.filter((n) => n.type === "category").length,
                    merchants: data.nodes.filter((n) => n.type === "merchant").length,
                    insights: data.nodes.filter((n) => n.type === "insight").length,
                  },
                  topEntities: stats.topNodesByDegree.slice(0, 10),
                },
                null,
                2
              ),
              mimeType: "application/json",
            },
          ],
        };
      } catch (error) {
        logger.error({ error }, "Failed to build knowledge graph resource");
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: "Failed to build knowledge graph" }),
              mimeType: "application/json",
            },
          ],
        };
      }
    }
  );

  // Resource: Financial knowledge base entries
  server.resource(
    "financial_knowledge",
    "wealthwise://financial-knowledge",
    "Financial knowledge base with rules, tips, and best practices organized by category",
    async (uri) => {
      const userId = getUserId();

      try {
        const { knowledgeBase } = await getOrBuild(userId);
        const stats = knowledgeBase.getStats();
        const entries = knowledgeBase.toJSON();

        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(
                {
                  stats,
                  categories: Object.entries(stats.entriesByCategory).map(([cat, count]) => ({
                    category: cat,
                    count,
                    entries: entries
                      .filter((e) => e.category === cat)
                      .slice(0, 3)
                      .map((e) => ({ title: e.title, tags: e.tags })),
                  })),
                  topTags: stats.topTags.slice(0, 15),
                },
                null,
                2
              ),
              mimeType: "application/json",
            },
          ],
        };
      } catch (error) {
        logger.error({ error }, "Failed to build financial knowledge resource");
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: "Failed to build financial knowledge" }),
              mimeType: "application/json",
            },
          ],
        };
      }
    }
  );
}
