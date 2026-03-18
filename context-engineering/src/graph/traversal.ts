import { KnowledgeGraph } from "./knowledge-graph";
import { GraphNode, GraphEdge, GraphPath, NodeType, EdgeType } from "./types";

export interface TraversalOptions {
  maxDepth?: number;
  maxNodes?: number;
  edgeTypes?: EdgeType[];
  nodeTypes?: NodeType[];
  minWeight?: number;
  visitedSet?: Set<string>;
}

/**
 * Simple min-heap priority queue for weighted traversal and Dijkstra.
 */
class PriorityQueue<T> {
  private heap: Array<{ item: T; priority: number }> = [];

  get size(): number {
    return this.heap.length;
  }

  enqueue(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return top.item;
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].priority <= this.heap[idx].priority) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }

  private sinkDown(idx: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < length && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }
}

export class GraphTraversal {
  constructor(private graph: KnowledgeGraph) {}

  /**
   * BFS - returns nodes in breadth-first order from startId.
   */
  bfs(startId: string, options?: TraversalOptions): GraphNode[] {
    const startNode = this.graph.getNode(startId);
    if (!startNode) return [];

    const maxDepth = options?.maxDepth ?? Infinity;
    const maxNodes = options?.maxNodes ?? Infinity;
    const edgeTypeSet = options?.edgeTypes ? new Set(options.edgeTypes) : null;
    const nodeTypeSet = options?.nodeTypes ? new Set(options.nodeTypes) : null;
    const minWeight = options?.minWeight ?? 0;
    const visited = options?.visitedSet ?? new Set<string>();

    const result: GraphNode[] = [];
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: startId, depth: 0 }];
    visited.add(startId);
    result.push(startNode);

    while (queue.length > 0 && result.length < maxNodes) {
      const { nodeId, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;

      const outgoing = this.graph.getOutgoingEdges(nodeId);
      for (const edge of outgoing) {
        if (result.length >= maxNodes) break;
        if (visited.has(edge.target)) continue;
        if (edge.weight < minWeight) continue;
        if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;

        const targetNode = this.graph.getNode(edge.target);
        if (!targetNode) continue;
        if (nodeTypeSet && !nodeTypeSet.has(targetNode.type)) continue;

        visited.add(edge.target);
        result.push(targetNode);
        queue.push({ nodeId: edge.target, depth: depth + 1 });
      }

      // Also traverse incoming edges (undirected semantics for BFS)
      const incoming = this.graph.getIncomingEdges(nodeId);
      for (const edge of incoming) {
        if (result.length >= maxNodes) break;
        if (visited.has(edge.source)) continue;
        if (edge.weight < minWeight) continue;
        if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;

        const sourceNode = this.graph.getNode(edge.source);
        if (!sourceNode) continue;
        if (nodeTypeSet && !nodeTypeSet.has(sourceNode.type)) continue;

        visited.add(edge.source);
        result.push(sourceNode);
        queue.push({ nodeId: edge.source, depth: depth + 1 });
      }
    }

    return result;
  }

  /**
   * DFS - returns nodes in depth-first order from startId.
   */
  dfs(startId: string, options?: TraversalOptions): GraphNode[] {
    const startNode = this.graph.getNode(startId);
    if (!startNode) return [];

    const maxDepth = options?.maxDepth ?? Infinity;
    const maxNodes = options?.maxNodes ?? Infinity;
    const edgeTypeSet = options?.edgeTypes ? new Set(options.edgeTypes) : null;
    const nodeTypeSet = options?.nodeTypes ? new Set(options.nodeTypes) : null;
    const minWeight = options?.minWeight ?? 0;
    const visited = options?.visitedSet ?? new Set<string>();

    const result: GraphNode[] = [];

    const recurse = (nodeId: string, depth: number): void => {
      if (result.length >= maxNodes) return;
      if (depth > maxDepth) return;

      const node = this.graph.getNode(nodeId);
      if (!node) return;
      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      result.push(node);

      const outgoing = this.graph.getOutgoingEdges(nodeId);
      for (const edge of outgoing) {
        if (result.length >= maxNodes) return;
        if (visited.has(edge.target)) continue;
        if (edge.weight < minWeight) continue;
        if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;

        const targetNode = this.graph.getNode(edge.target);
        if (!targetNode) continue;
        if (nodeTypeSet && !nodeTypeSet.has(targetNode.type)) continue;

        recurse(edge.target, depth + 1);
      }

      const incoming = this.graph.getIncomingEdges(nodeId);
      for (const edge of incoming) {
        if (result.length >= maxNodes) return;
        if (visited.has(edge.source)) continue;
        if (edge.weight < minWeight) continue;
        if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;

        const sourceNode = this.graph.getNode(edge.source);
        if (!sourceNode) continue;
        if (nodeTypeSet && !nodeTypeSet.has(sourceNode.type)) continue;

        recurse(edge.source, depth + 1);
      }
    };

    recurse(startId, 0);
    return result;
  }

  /**
   * Weighted traversal - visits highest-weight edges first using a max-priority queue.
   * We negate weight for the min-heap so highest weight is dequeued first.
   */
  weightedTraversal(startId: string, options?: TraversalOptions): GraphNode[] {
    const startNode = this.graph.getNode(startId);
    if (!startNode) return [];

    const maxDepth = options?.maxDepth ?? Infinity;
    const maxNodes = options?.maxNodes ?? Infinity;
    const edgeTypeSet = options?.edgeTypes ? new Set(options.edgeTypes) : null;
    const nodeTypeSet = options?.nodeTypes ? new Set(options.nodeTypes) : null;
    const minWeight = options?.minWeight ?? 0;
    const visited = options?.visitedSet ?? new Set<string>();

    const result: GraphNode[] = [];
    // Priority queue: lower priority = dequeued first. Use negative weight for max-first.
    const pq = new PriorityQueue<{ nodeId: string; depth: number }>();
    pq.enqueue({ nodeId: startId, depth: 0 }, 0);

    while (pq.size > 0 && result.length < maxNodes) {
      const current = pq.dequeue()!;
      if (visited.has(current.nodeId)) continue;

      const node = this.graph.getNode(current.nodeId);
      if (!node) continue;

      // Skip non-start nodes that don't match nodeTypes
      if (current.nodeId !== startId && nodeTypeSet && !nodeTypeSet.has(node.type)) {
        continue;
      }

      visited.add(current.nodeId);
      result.push(node);

      if (current.depth >= maxDepth) continue;

      const outgoing = this.graph.getOutgoingEdges(current.nodeId);
      for (const edge of outgoing) {
        if (visited.has(edge.target)) continue;
        if (edge.weight < minWeight) continue;
        if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;

        // Negate weight for max-first ordering
        pq.enqueue({ nodeId: edge.target, depth: current.depth + 1 }, -edge.weight);
      }

      const incoming = this.graph.getIncomingEdges(current.nodeId);
      for (const edge of incoming) {
        if (visited.has(edge.source)) continue;
        if (edge.weight < minWeight) continue;
        if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;

        pq.enqueue({ nodeId: edge.source, depth: current.depth + 1 }, -edge.weight);
      }
    }

    return result;
  }

  /**
   * Dijkstra's shortest path.
   * Uses (1 - weight) as edge cost so higher-weight edges are cheaper to traverse.
   */
  shortestPath(startId: string, endId: string, options?: TraversalOptions): GraphPath | null {
    if (!this.graph.hasNode(startId) || !this.graph.hasNode(endId)) {
      return null;
    }

    const edgeTypeSet = options?.edgeTypes ? new Set(options.edgeTypes) : null;
    const minWeight = options?.minWeight ?? 0;

    const dist = new Map<string, number>();
    const prev = new Map<string, { nodeId: string; edge: GraphEdge } | null>();
    const visited = new Set<string>();
    const pq = new PriorityQueue<string>();

    dist.set(startId, 0);
    prev.set(startId, null);
    pq.enqueue(startId, 0);

    while (pq.size > 0) {
      const currentId = pq.dequeue()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      if (currentId === endId) break;

      const currentDist = dist.get(currentId) ?? Infinity;

      // Outgoing edges
      const outgoing = this.graph.getOutgoingEdges(currentId);
      for (const edge of outgoing) {
        if (visited.has(edge.target)) continue;
        if (edge.weight < minWeight) continue;
        if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;

        const cost = 1 - edge.weight; // higher weight = lower cost
        const newDist = currentDist + Math.max(cost, 0.001);

        if (newDist < (dist.get(edge.target) ?? Infinity)) {
          dist.set(edge.target, newDist);
          prev.set(edge.target, { nodeId: currentId, edge });
          pq.enqueue(edge.target, newDist);
        }
      }

      // Incoming edges (treat as undirected)
      const incoming = this.graph.getIncomingEdges(currentId);
      for (const edge of incoming) {
        if (visited.has(edge.source)) continue;
        if (edge.weight < minWeight) continue;
        if (edgeTypeSet && !edgeTypeSet.has(edge.type)) continue;

        const cost = 1 - edge.weight;
        const newDist = currentDist + Math.max(cost, 0.001);

        if (newDist < (dist.get(edge.source) ?? Infinity)) {
          dist.set(edge.source, newDist);
          prev.set(edge.source, { nodeId: currentId, edge });
          pq.enqueue(edge.source, newDist);
        }
      }
    }

    // Reconstruct path
    if (!prev.has(endId)) return null;

    const pathNodes: GraphNode[] = [];
    const pathEdges: GraphEdge[] = [];
    let currentId: string | undefined = endId;

    while (currentId !== undefined) {
      const node = this.graph.getNode(currentId);
      if (node) pathNodes.unshift(node);

      const prevEntry = prev.get(currentId);
      if (!prevEntry) break;

      pathEdges.unshift(prevEntry.edge);
      currentId = prevEntry.nodeId;
    }

    if (pathNodes.length === 0 || pathNodes[0].id !== startId) return null;

    return {
      nodes: pathNodes,
      edges: pathEdges,
      totalWeight: pathEdges.reduce((sum, e) => sum + e.weight, 0),
      length: pathNodes.length,
    };
  }

  /**
   * All paths between two nodes with max depth limit.
   * Uses DFS with backtracking.
   */
  allPaths(startId: string, endId: string, maxDepth: number = 5): GraphPath[] {
    return this.graph.findPaths(startId, endId, maxDepth);
  }

  /**
   * PageRank-like relevance scoring.
   * Iterative computation with configurable damping factor and iterations.
   */
  computeRelevanceScores(
    iterations: number = 20,
    dampingFactor: number = 0.85
  ): Map<string, number> {
    const scores = new Map<string, number>();
    const nodeIds: string[] = [];

    // Collect all node IDs
    const allNodes = this.graph.searchNodes(() => true);
    for (const node of allNodes) {
      nodeIds.push(node.id);
    }

    const n = nodeIds.length;
    if (n === 0) return scores;

    const initialScore = 1 / n;
    for (const id of nodeIds) {
      scores.set(id, initialScore);
    }

    for (let iter = 0; iter < iterations; iter++) {
      const newScores = new Map<string, number>();

      for (const id of nodeIds) {
        newScores.set(id, (1 - dampingFactor) / n);
      }

      for (const id of nodeIds) {
        const currentScore = scores.get(id) ?? 0;
        const outgoing = this.graph.getOutgoingEdges(id);
        const outDegree = outgoing.length;

        if (outDegree === 0) {
          // Distribute to all nodes (dangling node)
          const share = (dampingFactor * currentScore) / n;
          for (const nid of nodeIds) {
            newScores.set(nid, (newScores.get(nid) ?? 0) + share);
          }
        } else {
          const share = (dampingFactor * currentScore) / outDegree;
          for (const edge of outgoing) {
            if (newScores.has(edge.target)) {
              newScores.set(edge.target, (newScores.get(edge.target) ?? 0) + share);
            }
          }
        }
      }

      for (const [id, score] of newScores) {
        scores.set(id, score);
      }
    }

    return scores;
  }

  /**
   * Context-aware traversal: start from seed nodes and expand outward,
   * collecting the most relevant context based on edge weights and node type priority.
   */
  contextExpansion(
    seedNodeIds: string[],
    options: {
      maxNodes?: number;
      maxDepth?: number;
      relevanceThreshold?: number;
      priorityNodeTypes?: NodeType[];
      priorityEdgeTypes?: EdgeType[];
    } = {}
  ): {
    nodes: GraphNode[];
    edges: GraphEdge[];
    relevanceMap: Map<string, number>;
  } {
    const maxNodes = options.maxNodes ?? 50;
    const maxDepth = options.maxDepth ?? 3;
    const relevanceThreshold = options.relevanceThreshold ?? 0.1;
    const priorityNodeTypes = options.priorityNodeTypes ? new Set(options.priorityNodeTypes) : null;
    const priorityEdgeTypes = options.priorityEdgeTypes ? new Set(options.priorityEdgeTypes) : null;

    const relevanceMap = new Map<string, number>();
    const visitedNodes = new Set<string>();
    const collectedEdges = new Map<string, GraphEdge>();

    // Initialize seed nodes with max relevance
    for (const seedId of seedNodeIds) {
      if (this.graph.hasNode(seedId)) {
        relevanceMap.set(seedId, 1.0);
      }
    }

    // Priority queue: higher relevance = lower priority value (negated)
    const pq = new PriorityQueue<{
      nodeId: string;
      depth: number;
      relevance: number;
    }>();

    for (const seedId of seedNodeIds) {
      if (this.graph.hasNode(seedId)) {
        pq.enqueue({ nodeId: seedId, depth: 0, relevance: 1.0 }, -1.0);
      }
    }

    const resultNodes: GraphNode[] = [];

    while (pq.size > 0 && resultNodes.length < maxNodes) {
      const current = pq.dequeue()!;
      if (visitedNodes.has(current.nodeId)) continue;

      const node = this.graph.getNode(current.nodeId);
      if (!node) continue;

      if (current.relevance < relevanceThreshold) continue;

      visitedNodes.add(current.nodeId);
      resultNodes.push(node);
      relevanceMap.set(current.nodeId, current.relevance);

      if (current.depth >= maxDepth) continue;

      // Expand outgoing
      const outgoing = this.graph.getOutgoingEdges(current.nodeId);
      for (const edge of outgoing) {
        if (visitedNodes.has(edge.target)) continue;

        // Calculate relevance decay
        let edgeMultiplier = edge.weight;
        if (priorityEdgeTypes && priorityEdgeTypes.has(edge.type)) {
          edgeMultiplier = Math.min(edgeMultiplier * 1.5, 1.0);
        }

        const targetNode = this.graph.getNode(edge.target);
        if (targetNode && priorityNodeTypes && priorityNodeTypes.has(targetNode.type)) {
          edgeMultiplier = Math.min(edgeMultiplier * 1.3, 1.0);
        }

        const childRelevance = current.relevance * edgeMultiplier * 0.8;

        if (childRelevance >= relevanceThreshold) {
          const existingRelevance = relevanceMap.get(edge.target) ?? 0;
          if (childRelevance > existingRelevance) {
            relevanceMap.set(edge.target, childRelevance);
          }
          collectedEdges.set(edge.id, edge);
          pq.enqueue(
            {
              nodeId: edge.target,
              depth: current.depth + 1,
              relevance: childRelevance,
            },
            -childRelevance
          );
        }
      }

      // Expand incoming
      const incoming = this.graph.getIncomingEdges(current.nodeId);
      for (const edge of incoming) {
        if (visitedNodes.has(edge.source)) continue;

        let edgeMultiplier = edge.weight;
        if (priorityEdgeTypes && priorityEdgeTypes.has(edge.type)) {
          edgeMultiplier = Math.min(edgeMultiplier * 1.5, 1.0);
        }

        const sourceNode = this.graph.getNode(edge.source);
        if (sourceNode && priorityNodeTypes && priorityNodeTypes.has(sourceNode.type)) {
          edgeMultiplier = Math.min(edgeMultiplier * 1.3, 1.0);
        }

        const childRelevance = current.relevance * edgeMultiplier * 0.7; // incoming slightly less relevant

        if (childRelevance >= relevanceThreshold) {
          const existingRelevance = relevanceMap.get(edge.source) ?? 0;
          if (childRelevance > existingRelevance) {
            relevanceMap.set(edge.source, childRelevance);
          }
          collectedEdges.set(edge.id, edge);
          pq.enqueue(
            {
              nodeId: edge.source,
              depth: current.depth + 1,
              relevance: childRelevance,
            },
            -childRelevance
          );
        }
      }
    }

    // Filter edges to only those connecting collected nodes
    const collectedNodeIds = new Set(resultNodes.map((n) => n.id));
    const filteredEdges: GraphEdge[] = [];
    for (const edge of collectedEdges.values()) {
      if (collectedNodeIds.has(edge.source) && collectedNodeIds.has(edge.target)) {
        filteredEdges.push(edge);
      }
    }

    return {
      nodes: resultNodes,
      edges: filteredEdges,
      relevanceMap,
    };
  }

  /**
   * Find clusters/communities using label propagation algorithm.
   * Each node starts with its own label, then iteratively adopts
   * the most common label among its neighbors.
   */
  findClusters(): Map<string, string[]> {
    const allNodes = this.graph.searchNodes(() => true);
    if (allNodes.length === 0) return new Map();

    // Initialize: each node is its own cluster
    const labels = new Map<string, string>();
    for (const node of allNodes) {
      labels.set(node.id, node.id);
    }

    const maxIterations = 50;
    let changed = true;
    let iteration = 0;

    while (changed && iteration < maxIterations) {
      changed = false;
      iteration++;

      // Randomize processing order by shuffling
      const shuffled = [...allNodes];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      for (const node of shuffled) {
        const neighbors = this.graph.getNeighbors(node.id, {
          direction: "both",
        });
        if (neighbors.length === 0) continue;

        // Count neighbor labels
        const labelCounts = new Map<string, number>();
        for (const neighbor of neighbors) {
          const nLabel = labels.get(neighbor.id);
          if (nLabel) {
            labelCounts.set(nLabel, (labelCounts.get(nLabel) ?? 0) + 1);
          }
        }

        // Find most common label
        let maxCount = 0;
        let bestLabel = labels.get(node.id)!;
        for (const [label, count] of labelCounts) {
          if (count > maxCount) {
            maxCount = count;
            bestLabel = label;
          }
        }

        if (bestLabel !== labels.get(node.id)) {
          labels.set(node.id, bestLabel);
          changed = true;
        }
      }
    }

    // Group by label
    const clusters = new Map<string, string[]>();
    for (const [nodeId, label] of labels) {
      if (!clusters.has(label)) {
        clusters.set(label, []);
      }
      clusters.get(label)!.push(nodeId);
    }

    return clusters;
  }

  /**
   * Get the k-hop neighborhood of a node.
   * Returns all nodes and edges within k hops.
   */
  kHopNeighborhood(
    nodeId: string,
    k: number,
    options?: TraversalOptions
  ): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes = this.bfs(nodeId, {
      ...options,
      maxDepth: k,
    });

    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const edges: GraphEdge[] = [];
    const edgesSeen = new Set<string>();

    for (const nId of nodeIdSet) {
      const outgoing = this.graph.getOutgoingEdges(nId);
      for (const edge of outgoing) {
        if (nodeIdSet.has(edge.target) && !edgesSeen.has(edge.id)) {
          edges.push(edge);
          edgesSeen.add(edge.id);
        }
      }
    }

    return { nodes, edges };
  }
}
