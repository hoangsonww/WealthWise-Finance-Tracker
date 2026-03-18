import {
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  GraphStats,
  GraphQuery,
  GraphQueryResult,
  GraphPath,
} from "./types";
import { logger } from "../utils/logger";

export class KnowledgeGraph {
  private nodes: Map<string, GraphNode>;
  private edges: Map<string, GraphEdge>;
  private adjacencyList: Map<string, Set<string>>; // nodeId -> set of outgoing edgeIds
  private reverseAdjacency: Map<string, Set<string>>; // nodeId -> set of incoming edgeIds
  private nodesByType: Map<NodeType, Set<string>>; // type -> set of nodeIds
  private edgesByType: Map<EdgeType, Set<string>>; // type -> set of edgeIds

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacencyList = new Map();
    this.reverseAdjacency = new Map();
    this.nodesByType = new Map();
    this.edgesByType = new Map();

    // Initialize type indexes
    for (const type of Object.values(NodeType)) {
      this.nodesByType.set(type, new Set());
    }
    for (const type of Object.values(EdgeType)) {
      this.edgesByType.set(type, new Set());
    }
  }

  // --- Node operations ---

  addNode(node: GraphNode): void {
    if (this.nodes.has(node.id)) {
      logger.warn({ nodeId: node.id }, "Node already exists, overwriting");
    }
    this.nodes.set(node.id, node);

    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set());
    }
    if (!this.reverseAdjacency.has(node.id)) {
      this.reverseAdjacency.set(node.id, new Set());
    }

    const typeSet = this.nodesByType.get(node.type);
    if (typeSet) {
      typeSet.add(node.id);
    } else {
      this.nodesByType.set(node.type, new Set([node.id]));
    }
  }

  getNode(id: string): GraphNode | undefined {
    const node = this.nodes.get(id);
    if (node) {
      node.metadata.accessCount += 1;
      node.metadata.lastAccessedAt = new Date().toISOString();
    }
    return node;
  }

  getNodesByType(type: NodeType): GraphNode[] {
    const ids = this.nodesByType.get(type);
    if (!ids) return [];
    const result: GraphNode[] = [];
    for (const id of ids) {
      const node = this.nodes.get(id);
      if (node) result.push(node);
    }
    return result;
  }

  updateNode(id: string, updates: Partial<GraphNode>): boolean {
    const existing = this.nodes.get(id);
    if (!existing) return false;

    // If the type changed, update type indexes
    if (updates.type && updates.type !== existing.type) {
      const oldTypeSet = this.nodesByType.get(existing.type);
      if (oldTypeSet) oldTypeSet.delete(id);
      const newTypeSet = this.nodesByType.get(updates.type);
      if (newTypeSet) {
        newTypeSet.add(id);
      } else {
        this.nodesByType.set(updates.type, new Set([id]));
      }
    }

    const updated: GraphNode = {
      ...existing,
      ...updates,
      id: existing.id, // Never change ID
      metadata: {
        ...existing.metadata,
        ...(updates.metadata ?? {}),
        updatedAt: new Date().toISOString(),
        version: existing.metadata.version + 1,
      },
    };
    this.nodes.set(id, updated);
    return true;
  }

  removeNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    // Remove all connected edges
    const outgoing = this.adjacencyList.get(id);
    if (outgoing) {
      for (const edgeId of outgoing) {
        this.removeEdgeInternal(edgeId);
      }
    }
    const incoming = this.reverseAdjacency.get(id);
    if (incoming) {
      for (const edgeId of incoming) {
        this.removeEdgeInternal(edgeId);
      }
    }

    // Remove from type index
    const typeSet = this.nodesByType.get(node.type);
    if (typeSet) typeSet.delete(id);

    // Remove adjacency entries
    this.adjacencyList.delete(id);
    this.reverseAdjacency.delete(id);

    // Remove node
    this.nodes.delete(id);
    return true;
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  // --- Edge operations ---

  addEdge(edge: GraphEdge): void {
    if (this.edges.has(edge.id)) {
      logger.warn({ edgeId: edge.id }, "Edge already exists, overwriting");
    }

    // Verify source and target nodes exist
    if (!this.nodes.has(edge.source)) {
      logger.warn({ edgeId: edge.id, source: edge.source }, "Source node does not exist for edge");
    }
    if (!this.nodes.has(edge.target)) {
      logger.warn({ edgeId: edge.id, target: edge.target }, "Target node does not exist for edge");
    }

    this.edges.set(edge.id, edge);

    // Update adjacency lists
    if (!this.adjacencyList.has(edge.source)) {
      this.adjacencyList.set(edge.source, new Set());
    }
    this.adjacencyList.get(edge.source)!.add(edge.id);

    if (!this.reverseAdjacency.has(edge.target)) {
      this.reverseAdjacency.set(edge.target, new Set());
    }
    this.reverseAdjacency.get(edge.target)!.add(edge.id);

    // Update type index
    const typeSet = this.edgesByType.get(edge.type);
    if (typeSet) {
      typeSet.add(edge.id);
    } else {
      this.edgesByType.set(edge.type, new Set([edge.id]));
    }
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  getEdgesBetween(sourceId: string, targetId: string): GraphEdge[] {
    const outgoing = this.adjacencyList.get(sourceId);
    if (!outgoing) return [];

    const result: GraphEdge[] = [];
    for (const edgeId of outgoing) {
      const edge = this.edges.get(edgeId);
      if (edge && edge.target === targetId) {
        result.push(edge);
      }
    }
    return result;
  }

  getOutgoingEdges(nodeId: string): GraphEdge[] {
    const edgeIds = this.adjacencyList.get(nodeId);
    if (!edgeIds) return [];

    const result: GraphEdge[] = [];
    for (const edgeId of edgeIds) {
      const edge = this.edges.get(edgeId);
      if (edge) result.push(edge);
    }
    return result;
  }

  getIncomingEdges(nodeId: string): GraphEdge[] {
    const edgeIds = this.reverseAdjacency.get(nodeId);
    if (!edgeIds) return [];

    const result: GraphEdge[] = [];
    for (const edgeId of edgeIds) {
      const edge = this.edges.get(edgeId);
      if (edge) result.push(edge);
    }
    return result;
  }

  removeEdge(id: string): boolean {
    return this.removeEdgeInternal(id);
  }

  hasEdge(id: string): boolean {
    return this.edges.has(id);
  }

  // Internal edge removal that cleans up indexes
  private removeEdgeInternal(id: string): boolean {
    const edge = this.edges.get(id);
    if (!edge) return false;

    // Remove from adjacency lists
    const outgoing = this.adjacencyList.get(edge.source);
    if (outgoing) outgoing.delete(id);

    const incoming = this.reverseAdjacency.get(edge.target);
    if (incoming) incoming.delete(id);

    // Remove from type index
    const typeSet = this.edgesByType.get(edge.type);
    if (typeSet) typeSet.delete(id);

    this.edges.delete(id);
    return true;
  }

  // --- Neighbor operations ---

  getNeighbors(
    nodeId: string,
    options?: {
      edgeTypes?: EdgeType[];
      nodeTypes?: NodeType[];
      direction?: "outgoing" | "incoming" | "both";
    }
  ): GraphNode[] {
    const direction = options?.direction ?? "both";
    const edgeTypeSet = options?.edgeTypes ? new Set(options.edgeTypes) : null;
    const nodeTypeSet = options?.nodeTypes ? new Set(options.nodeTypes) : null;
    const neighborIds = new Set<string>();

    if (direction === "outgoing" || direction === "both") {
      const outEdgeIds = this.adjacencyList.get(nodeId);
      if (outEdgeIds) {
        for (const edgeId of outEdgeIds) {
          const edge = this.edges.get(edgeId);
          if (!edge) continue;
          if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;
          neighborIds.add(edge.target);
        }
      }
    }

    if (direction === "incoming" || direction === "both") {
      const inEdgeIds = this.reverseAdjacency.get(nodeId);
      if (inEdgeIds) {
        for (const edgeId of inEdgeIds) {
          const edge = this.edges.get(edgeId);
          if (!edge) continue;
          if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;
          neighborIds.add(edge.source);
        }
      }
    }

    const result: GraphNode[] = [];
    for (const nId of neighborIds) {
      if (nId === nodeId) continue; // skip self-loops
      const node = this.nodes.get(nId);
      if (!node) continue;
      if (nodeTypeSet && !nodeTypeSet.has(node.type)) continue;
      result.push(node);
    }
    return result;
  }

  getDegree(nodeId: string, direction?: "outgoing" | "incoming" | "both"): number {
    const dir = direction ?? "both";
    let degree = 0;
    if (dir === "outgoing" || dir === "both") {
      const outgoing = this.adjacencyList.get(nodeId);
      if (outgoing) degree += outgoing.size;
    }
    if (dir === "incoming" || dir === "both") {
      const incoming = this.reverseAdjacency.get(nodeId);
      if (incoming) degree += incoming.size;
    }
    return degree;
  }

  // --- Query ---

  query(graphQuery: GraphQuery): GraphQueryResult {
    const startTime = Date.now();
    const resultNodes = new Map<string, GraphNode>();
    const resultEdges = new Map<string, GraphEdge>();
    const paths: GraphPath[] = [];
    let maxDepthReached = 0;

    const maxDepth = graphQuery.maxDepth ?? 3;
    const limit = graphQuery.limit ?? 100;
    const minWeight = graphQuery.minWeight ?? 0;

    // Determine start nodes
    let startNodes: GraphNode[] = [];
    if (graphQuery.startNodeId) {
      const node = this.nodes.get(graphQuery.startNodeId);
      if (node) startNodes = [node];
    } else if (graphQuery.startNodeType) {
      startNodes = this.getNodesByType(graphQuery.startNodeType);
    } else {
      // No start specified, return first `limit` nodes
      let count = 0;
      for (const node of this.nodes.values()) {
        if (count >= limit) break;
        resultNodes.set(node.id, node);
        count++;
      }
      return {
        nodes: Array.from(resultNodes.values()),
        edges: [],
        paths: [],
        metadata: {
          queryTimeMs: Date.now() - startTime,
          totalNodes: resultNodes.size,
          totalEdges: 0,
          maxDepthReached: 0,
        },
      };
    }

    const edgeTypeSet = graphQuery.edgeTypes ? new Set(graphQuery.edgeTypes) : null;
    const targetTypeSet = graphQuery.targetNodeTypes ? new Set(graphQuery.targetNodeTypes) : null;

    // BFS traversal from start nodes
    for (const startNode of startNodes) {
      if (resultNodes.size >= limit) break;

      const visited = new Set<string>();
      const queue: Array<{
        nodeId: string;
        depth: number;
        path: GraphNode[];
        pathEdges: GraphEdge[];
      }> = [{ nodeId: startNode.id, depth: 0, path: [startNode], pathEdges: [] }];
      visited.add(startNode.id);
      resultNodes.set(startNode.id, startNode);

      while (queue.length > 0 && resultNodes.size < limit) {
        const current = queue.shift()!;
        if (current.depth >= maxDepth) continue;

        const outEdgeIds = this.adjacencyList.get(current.nodeId);
        if (!outEdgeIds) continue;

        for (const edgeId of outEdgeIds) {
          if (resultNodes.size >= limit) break;

          const edge = this.edges.get(edgeId);
          if (!edge) continue;
          if (edge.weight < minWeight) continue;
          if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;

          const targetNode = this.nodes.get(edge.target);
          if (!targetNode) continue;
          if (targetTypeSet && !targetTypeSet.has(targetNode.type)) continue;

          resultEdges.set(edge.id, edge);

          if (!visited.has(edge.target)) {
            visited.add(edge.target);
            resultNodes.set(edge.target, targetNode);

            const newPath = [...current.path, targetNode];
            const newPathEdges = [...current.pathEdges, edge];
            const newDepth = current.depth + 1;

            if (newDepth > maxDepthReached) {
              maxDepthReached = newDepth;
            }

            paths.push({
              nodes: newPath,
              edges: newPathEdges,
              totalWeight: newPathEdges.reduce((sum, e) => sum + e.weight, 0),
              length: newPath.length,
            });

            queue.push({
              nodeId: edge.target,
              depth: newDepth,
              path: newPath,
              pathEdges: newPathEdges,
            });
          }
        }
      }
    }

    return {
      nodes: Array.from(resultNodes.values()),
      edges: Array.from(resultEdges.values()),
      paths,
      metadata: {
        queryTimeMs: Date.now() - startTime,
        totalNodes: resultNodes.size,
        totalEdges: resultEdges.size,
        maxDepthReached,
      },
    };
  }

  findPaths(startId: string, endId: string, maxDepth: number = 5): GraphPath[] {
    const results: GraphPath[] = [];
    if (!this.nodes.has(startId) || !this.nodes.has(endId)) return results;

    const startNode = this.nodes.get(startId)!;

    const dfs = (
      currentId: string,
      visited: Set<string>,
      path: GraphNode[],
      pathEdges: GraphEdge[],
      depth: number
    ): void => {
      if (currentId === endId && path.length > 1) {
        results.push({
          nodes: [...path],
          edges: [...pathEdges],
          totalWeight: pathEdges.reduce((sum, e) => sum + e.weight, 0),
          length: path.length,
        });
        return;
      }

      if (depth >= maxDepth) return;

      const outEdgeIds = this.adjacencyList.get(currentId);
      if (!outEdgeIds) return;

      for (const edgeId of outEdgeIds) {
        const edge = this.edges.get(edgeId);
        if (!edge) continue;
        if (visited.has(edge.target)) continue;

        const targetNode = this.nodes.get(edge.target);
        if (!targetNode) continue;

        visited.add(edge.target);
        path.push(targetNode);
        pathEdges.push(edge);

        dfs(edge.target, visited, path, pathEdges, depth + 1);

        path.pop();
        pathEdges.pop();
        visited.delete(edge.target);
      }
    };

    const visited = new Set<string>([startId]);
    dfs(startId, visited, [startNode], [], 0);

    // Sort by total weight descending (higher weight = more relevant)
    results.sort((a, b) => b.totalWeight - a.totalWeight);
    return results;
  }

  getSubgraph(nodeIds: string[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodeSet = new Set(nodeIds);
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    for (const id of nodeIds) {
      const node = this.nodes.get(id);
      if (node) nodes.push(node);
    }

    // Include edges where both source and target are in the subgraph
    for (const edge of this.edges.values()) {
      if (nodeSet.has(edge.source) && nodeSet.has(edge.target)) {
        edges.push(edge);
      }
    }

    return { nodes, edges };
  }

  // --- Search ---

  searchNodes(predicate: (node: GraphNode) => boolean): GraphNode[] {
    const results: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (predicate(node)) {
        results.push(node);
      }
    }
    return results;
  }

  searchByLabel(query: string): GraphNode[] {
    const lowerQuery = query.toLowerCase();
    const results: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.label.toLowerCase().includes(lowerQuery)) {
        results.push(node);
      }
    }
    return results;
  }

  // --- Statistics ---

  getStats(): GraphStats {
    const nodesByType: Record<string, number> = {};
    for (const type of Object.values(NodeType)) {
      const set = this.nodesByType.get(type);
      nodesByType[type] = set ? set.size : 0;
    }

    const edgesByType: Record<string, number> = {};
    for (const type of Object.values(EdgeType)) {
      const set = this.edgesByType.get(type);
      edgesByType[type] = set ? set.size : 0;
    }

    const totalNodes = this.nodes.size;
    const totalEdges = this.edges.size;

    // Calculate average degree
    let totalDegree = 0;
    for (const nodeId of this.nodes.keys()) {
      totalDegree += this.getDegree(nodeId, "both");
    }
    const averageDegree = totalNodes > 0 ? totalDegree / totalNodes : 0;

    // Density = E / (V * (V-1)) for directed graphs
    const density = totalNodes > 1 ? totalEdges / (totalNodes * (totalNodes - 1)) : 0;

    // Connected components via BFS on undirected view
    const connectedComponents = this.countConnectedComponents();

    // Top nodes by degree
    const degreeList: Array<{
      nodeId: string;
      label: string;
      degree: number;
    }> = [];
    for (const [nodeId, node] of this.nodes.entries()) {
      degreeList.push({
        nodeId,
        label: node.label,
        degree: this.getDegree(nodeId, "both"),
      });
    }
    degreeList.sort((a, b) => b.degree - a.degree);
    const topNodesByDegree = degreeList.slice(0, 10);

    return {
      totalNodes,
      totalEdges,
      nodesByType: nodesByType as Record<NodeType, number>,
      edgesByType: edgesByType as Record<EdgeType, number>,
      averageDegree,
      density,
      connectedComponents,
      topNodesByDegree,
    };
  }

  private countConnectedComponents(): number {
    const visited = new Set<string>();
    let components = 0;

    for (const nodeId of this.nodes.keys()) {
      if (visited.has(nodeId)) continue;
      components++;

      // BFS on undirected view
      const queue: string[] = [nodeId];
      visited.add(nodeId);

      while (queue.length > 0) {
        const current = queue.shift()!;

        // Outgoing
        const outEdgeIds = this.adjacencyList.get(current);
        if (outEdgeIds) {
          for (const edgeId of outEdgeIds) {
            const edge = this.edges.get(edgeId);
            if (edge && !visited.has(edge.target)) {
              visited.add(edge.target);
              queue.push(edge.target);
            }
          }
        }

        // Incoming (treat as undirected)
        const inEdgeIds = this.reverseAdjacency.get(current);
        if (inEdgeIds) {
          for (const edgeId of inEdgeIds) {
            const edge = this.edges.get(edgeId);
            if (edge && !visited.has(edge.source)) {
              visited.add(edge.source);
              queue.push(edge.source);
            }
          }
        }
      }
    }

    return components;
  }

  // --- Bulk operations ---

  addNodes(nodes: GraphNode[]): void {
    for (const node of nodes) {
      this.addNode(node);
    }
  }

  addEdges(edges: GraphEdge[]): void {
    for (const edge of edges) {
      this.addEdge(edge);
    }
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacencyList.clear();
    this.reverseAdjacency.clear();
    for (const set of this.nodesByType.values()) set.clear();
    for (const set of this.edgesByType.values()) set.clear();
  }

  // --- Serialization ---

  toJSON(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
    };
  }

  static fromJSON(data: { nodes: GraphNode[]; edges: GraphEdge[] }): KnowledgeGraph {
    const graph = new KnowledgeGraph();
    graph.addNodes(data.nodes);
    graph.addEdges(data.edges);
    return graph;
  }

  // --- Size ---

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    return this.edges.size;
  }
}
