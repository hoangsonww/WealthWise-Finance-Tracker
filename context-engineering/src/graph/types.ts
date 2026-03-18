// Node types for the financial knowledge graph
export enum NodeType {
  Account = "account",
  Transaction = "transaction",
  Budget = "budget",
  Goal = "goal",
  Category = "category",
  RecurringPayment = "recurring_payment",
  FinancialRule = "financial_rule",
  Insight = "insight",
  UserProfile = "user_profile",
  TimePeriod = "time_period",
  Merchant = "merchant",
  Tag = "tag",
}

// Edge types representing relationships
export enum EdgeType {
  // Account relationships
  OWNS_ACCOUNT = "OWNS_ACCOUNT",
  TRANSACTION_FROM = "TRANSACTION_FROM",
  TRANSACTION_TO = "TRANSACTION_TO",

  // Category relationships
  CATEGORIZED_AS = "CATEGORIZED_AS",
  SUBCATEGORY_OF = "SUBCATEGORY_OF",

  // Budget relationships
  BUDGET_FOR_CATEGORY = "BUDGET_FOR_CATEGORY",
  BUDGET_FOR_ACCOUNT = "BUDGET_FOR_ACCOUNT",
  OVER_BUDGET = "OVER_BUDGET",

  // Goal relationships
  CONTRIBUTES_TO = "CONTRIBUTES_TO",
  FUNDED_BY = "FUNDED_BY",

  // Recurring relationships
  GENERATES = "GENERATES",
  PAID_FROM = "PAID_FROM",

  // Temporal relationships
  OCCURRED_IN = "OCCURRED_IN",
  PERIOD_CONTAINS = "PERIOD_CONTAINS",
  FOLLOWS = "FOLLOWS",

  // Insight relationships
  DERIVED_FROM = "DERIVED_FROM",
  APPLIES_TO = "APPLIES_TO",
  CONTRADICTS = "CONTRADICTS",
  SUPPORTS = "SUPPORTS",

  // Merchant relationships
  TRANSACTED_WITH = "TRANSACTED_WITH",

  // Tag relationships
  TAGGED_WITH = "TAGGED_WITH",

  // Rule relationships
  RULE_APPLIES_TO = "RULE_APPLIES_TO",
  TRIGGERED_BY = "TRIGGERED_BY",

  // Similarity
  SIMILAR_TO = "SIMILAR_TO",
}

// Per-node-type property maps
export interface NodeProperties {
  [NodeType.Account]: {
    name: string;
    accountType: string;
    balance: number;
    currency: string;
    institution?: string;
    isArchived: boolean;
  };
  [NodeType.Transaction]: {
    amount: number;
    type: "income" | "expense" | "transfer";
    description: string;
    date: string;
    merchantName?: string;
  };
  [NodeType.Budget]: {
    name: string;
    amount: number;
    spent: number;
    period: string;
    startDate: string;
    endDate: string;
    utilizationPercent: number;
  };
  [NodeType.Goal]: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string;
    progressPercent: number;
    status: string;
  };
  [NodeType.Category]: {
    name: string;
    icon?: string;
    parentCategory?: string;
    isSystem: boolean;
    transactionCount: number;
    totalSpent: number;
  };
  [NodeType.RecurringPayment]: {
    name: string;
    amount: number;
    frequency: string;
    nextDueDate?: string;
    isActive: boolean;
  };
  [NodeType.FinancialRule]: {
    title: string;
    description: string;
    category: string;
    severity: "info" | "warning" | "critical";
    condition: string;
    recommendation: string;
  };
  [NodeType.Insight]: {
    title: string;
    description: string;
    insightType: string;
    confidence: number;
    generatedAt: string;
    isActionable: boolean;
  };
  [NodeType.UserProfile]: {
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRate: number;
    riskTolerance: string;
    financialGoals: string[];
  };
  [NodeType.TimePeriod]: {
    periodType: "day" | "week" | "month" | "quarter" | "year";
    startDate: string;
    endDate: string;
    label: string;
  };
  [NodeType.Merchant]: {
    name: string;
    category?: string;
    transactionCount: number;
    totalSpent: number;
    averageTransaction: number;
  };
  [NodeType.Tag]: {
    name: string;
    color?: string;
    usageCount: number;
  };
}

export interface NodeMetadata {
  createdAt: string;
  updatedAt: string;
  source: string;
  userId: string;
  version: number;
  relevanceScore?: number;
  accessCount: number;
  lastAccessedAt?: string;
}

// A graph node with typed properties
export interface GraphNode<T extends NodeType = NodeType> {
  id: string;
  type: T;
  label: string;
  properties: NodeProperties[T];
  metadata: NodeMetadata;
}

// A typed edge
export interface GraphEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  type: EdgeType;
  weight: number; // 0-1, relevance weight
  properties: EdgeProperties;
  metadata: {
    createdAt: string;
    updatedAt: string;
    source: string;
    userId: string;
  };
}

export interface EdgeProperties {
  label?: string;
  description?: string;
  strength?: number; // 0-1 confidence
  temporal?: boolean;
  bidirectional?: boolean;
  context?: Record<string, unknown>;
}

// Query types
export interface GraphQuery {
  startNodeId?: string;
  startNodeType?: NodeType;
  edgeTypes?: EdgeType[];
  targetNodeTypes?: NodeType[];
  maxDepth?: number;
  minWeight?: number;
  limit?: number;
  filters?: Record<string, unknown>;
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  paths: GraphPath[];
  metadata: {
    queryTimeMs: number;
    totalNodes: number;
    totalEdges: number;
    maxDepthReached: number;
  };
}

export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalWeight: number;
  length: number;
}

// Traversal strategies
export enum TraversalStrategy {
  BFS = "bfs",
  DFS = "dfs",
  WEIGHTED = "weighted",
  PAGERANK = "pagerank",
  SHORTEST_PATH = "shortest_path",
}

// Graph statistics
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<NodeType, number>;
  edgesByType: Record<EdgeType, number>;
  averageDegree: number;
  density: number;
  connectedComponents: number;
  topNodesByDegree: Array<{ nodeId: string; label: string; degree: number }>;
}
