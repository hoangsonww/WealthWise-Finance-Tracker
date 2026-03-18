import { KnowledgeGraph } from "./knowledge-graph";
import { GraphNode, GraphEdge, NodeType, EdgeType, NodeMetadata, NodeProperties } from "./types";
import { logger } from "../utils/logger";

export interface AccountData {
  _id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institution?: string;
  isArchived?: boolean;
  userId: string;
}

export interface TransactionData {
  _id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
  categoryId?: string;
  accountId?: string;
  notes?: string;
  tags?: string[];
  userId: string;
}

export interface BudgetData {
  _id: string;
  name: string;
  amount: number;
  spent: number;
  period: string;
  startDate: string;
  endDate: string;
  categoryId?: string;
  userId: string;
}

export interface GoalData {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  status: string;
  userId: string;
}

export interface CategoryData {
  _id: string;
  name: string;
  icon?: string;
  parentId?: string;
  isSystem?: boolean;
  userId?: string;
}

export interface RecurringData {
  _id: string;
  name: string;
  amount: number;
  frequency: string;
  nextDueDate?: string;
  isActive: boolean;
  accountId?: string;
  categoryId?: string;
  userId: string;
}

export class GraphBuilder {
  private graph: KnowledgeGraph;
  private userId: string;
  private transactionData: TransactionData[] = [];
  private accountData: AccountData[] = [];
  private budgetData: BudgetData[] = [];
  private categoryData: CategoryData[] = [];

  constructor(graph: KnowledgeGraph, userId: string) {
    this.graph = graph;
    this.userId = userId;
  }

  /**
   * Build graph from raw financial data. This is the main entry point.
   */
  buildFromData(data: {
    accounts: AccountData[];
    transactions: TransactionData[];
    budgets: BudgetData[];
    goals: GoalData[];
    categories: CategoryData[];
    recurring: RecurringData[];
  }): KnowledgeGraph {
    logger.info(
      {
        userId: this.userId,
        accounts: data.accounts.length,
        transactions: data.transactions.length,
        budgets: data.budgets.length,
        goals: data.goals.length,
        categories: data.categories.length,
        recurring: data.recurring.length,
      },
      "Building knowledge graph from financial data"
    );

    // Store data for derived builders
    this.transactionData = data.transactions;
    this.accountData = data.accounts;
    this.budgetData = data.budgets;
    this.categoryData = data.categories;

    // Build primary entity nodes
    this.addCategories(data.categories);
    this.addAccounts(data.accounts);
    this.addTransactions(data.transactions);
    this.addBudgets(data.budgets);
    this.addGoals(data.goals);
    this.addRecurringPayments(data.recurring);

    // Build derived relationships
    this.buildMerchantNodes();
    this.buildTimePeriodNodes();
    this.buildCategorySpendingEdges();
    this.buildBudgetAlertEdges();
    this.buildGoalContributionEdges();
    this.buildInsightNodes();
    this.buildUserProfileNode();

    logger.info(
      {
        nodeCount: this.graph.nodeCount,
        edgeCount: this.graph.edgeCount,
      },
      "Knowledge graph built successfully"
    );

    return this.graph;
  }

  // --- Individual builders ---

  addAccounts(accounts: AccountData[]): void {
    for (const account of accounts) {
      const node: GraphNode<NodeType.Account> = {
        id: `account:${account._id}`,
        type: NodeType.Account,
        label: account.name,
        properties: {
          name: account.name,
          accountType: account.type,
          balance: account.balance,
          currency: account.currency,
          institution: account.institution,
          isArchived: account.isArchived ?? false,
        },
        metadata: this.createNodeMetadata(),
      };
      this.graph.addNode(node);

      // Create OWNS_ACCOUNT edge from user profile
      const edge: GraphEdge = {
        id: this.generateEdgeId(
          `user:${this.userId}`,
          `account:${account._id}`,
          EdgeType.OWNS_ACCOUNT
        ),
        source: `user:${this.userId}`,
        target: `account:${account._id}`,
        type: EdgeType.OWNS_ACCOUNT,
        weight: 0.9,
        properties: {
          label: "owns",
          description: `User owns ${account.name} (${account.type})`,
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: "graph-builder",
          userId: this.userId,
        },
      };
      this.graph.addEdge(edge);
    }
  }

  addTransactions(transactions: TransactionData[]): void {
    for (const tx of transactions) {
      const node: GraphNode<NodeType.Transaction> = {
        id: `tx:${tx._id}`,
        type: NodeType.Transaction,
        label: tx.description,
        properties: {
          amount: tx.amount,
          type: tx.type as "income" | "expense" | "transfer",
          description: tx.description,
          date: tx.date,
          merchantName: this.extractMerchantName(tx.description),
        },
        metadata: this.createNodeMetadata(),
      };
      this.graph.addNode(node);

      // Link transaction to account
      if (tx.accountId) {
        const fromEdge: GraphEdge = {
          id: this.generateEdgeId(
            `tx:${tx._id}`,
            `account:${tx.accountId}`,
            EdgeType.TRANSACTION_FROM
          ),
          source: `tx:${tx._id}`,
          target: `account:${tx.accountId}`,
          type: EdgeType.TRANSACTION_FROM,
          weight: 0.8,
          properties: {
            label: "from account",
            temporal: true,
            context: { date: tx.date },
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(fromEdge);
      }

      // Link transaction to category
      if (tx.categoryId) {
        const catEdge: GraphEdge = {
          id: this.generateEdgeId(`tx:${tx._id}`, `cat:${tx.categoryId}`, EdgeType.CATEGORIZED_AS),
          source: `tx:${tx._id}`,
          target: `cat:${tx.categoryId}`,
          type: EdgeType.CATEGORIZED_AS,
          weight: 0.85,
          properties: {
            label: "categorized as",
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(catEdge);
      }

      // Link transaction to tags
      if (tx.tags) {
        for (const tag of tx.tags) {
          const tagId = `tag:${tag.toLowerCase().replace(/\s+/g, "-")}`;
          // Ensure tag node exists
          if (!this.graph.hasNode(tagId)) {
            const tagNode: GraphNode<NodeType.Tag> = {
              id: tagId,
              type: NodeType.Tag,
              label: tag,
              properties: {
                name: tag,
                usageCount: 1,
              },
              metadata: this.createNodeMetadata(),
            };
            this.graph.addNode(tagNode);
          }

          const tagEdge: GraphEdge = {
            id: this.generateEdgeId(`tx:${tx._id}`, tagId, EdgeType.TAGGED_WITH),
            source: `tx:${tx._id}`,
            target: tagId,
            type: EdgeType.TAGGED_WITH,
            weight: 0.5,
            properties: { label: "tagged with" },
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              source: "graph-builder",
              userId: this.userId,
            },
          };
          this.graph.addEdge(tagEdge);
        }
      }
    }
  }

  addBudgets(budgets: BudgetData[]): void {
    for (const budget of budgets) {
      const utilizationPercent =
        budget.amount > 0 ? Math.round((budget.spent / budget.amount) * 100) : 0;

      const node: GraphNode<NodeType.Budget> = {
        id: `budget:${budget._id}`,
        type: NodeType.Budget,
        label: budget.name,
        properties: {
          name: budget.name,
          amount: budget.amount,
          spent: budget.spent,
          period: budget.period,
          startDate: budget.startDate,
          endDate: budget.endDate,
          utilizationPercent,
        },
        metadata: this.createNodeMetadata(),
      };
      this.graph.addNode(node);

      // Link budget to category
      if (budget.categoryId) {
        const catEdge: GraphEdge = {
          id: this.generateEdgeId(
            `budget:${budget._id}`,
            `cat:${budget.categoryId}`,
            EdgeType.BUDGET_FOR_CATEGORY
          ),
          source: `budget:${budget._id}`,
          target: `cat:${budget.categoryId}`,
          type: EdgeType.BUDGET_FOR_CATEGORY,
          weight: 0.9,
          properties: {
            label: "budget for category",
            context: { period: budget.period },
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(catEdge);
      }
    }
  }

  addGoals(goals: GoalData[]): void {
    for (const goal of goals) {
      const progressPercent =
        goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;

      const node: GraphNode<NodeType.Goal> = {
        id: `goal:${goal._id}`,
        type: NodeType.Goal,
        label: goal.name,
        properties: {
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          deadline: goal.deadline,
          progressPercent,
          status: goal.status,
        },
        metadata: this.createNodeMetadata(),
      };
      this.graph.addNode(node);
    }
  }

  addCategories(categories: CategoryData[]): void {
    for (const cat of categories) {
      const node: GraphNode<NodeType.Category> = {
        id: `cat:${cat._id}`,
        type: NodeType.Category,
        label: cat.name,
        properties: {
          name: cat.name,
          icon: cat.icon,
          parentCategory: cat.parentId,
          isSystem: cat.isSystem ?? false,
          transactionCount: 0,
          totalSpent: 0,
        },
        metadata: this.createNodeMetadata(),
      };
      this.graph.addNode(node);

      // Link subcategories
      if (cat.parentId) {
        const subEdge: GraphEdge = {
          id: this.generateEdgeId(`cat:${cat._id}`, `cat:${cat.parentId}`, EdgeType.SUBCATEGORY_OF),
          source: `cat:${cat._id}`,
          target: `cat:${cat.parentId}`,
          type: EdgeType.SUBCATEGORY_OF,
          weight: 0.9,
          properties: {
            label: "subcategory of",
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(subEdge);
      }
    }
  }

  addRecurringPayments(recurring: RecurringData[]): void {
    for (const rec of recurring) {
      const node: GraphNode<NodeType.RecurringPayment> = {
        id: `recurring:${rec._id}`,
        type: NodeType.RecurringPayment,
        label: rec.name,
        properties: {
          name: rec.name,
          amount: rec.amount,
          frequency: rec.frequency,
          nextDueDate: rec.nextDueDate,
          isActive: rec.isActive,
        },
        metadata: this.createNodeMetadata(),
      };
      this.graph.addNode(node);

      // Link recurring to account
      if (rec.accountId) {
        const paidEdge: GraphEdge = {
          id: this.generateEdgeId(
            `recurring:${rec._id}`,
            `account:${rec.accountId}`,
            EdgeType.PAID_FROM
          ),
          source: `recurring:${rec._id}`,
          target: `account:${rec.accountId}`,
          type: EdgeType.PAID_FROM,
          weight: 0.8,
          properties: { label: "paid from" },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(paidEdge);
      }

      // Link recurring to category
      if (rec.categoryId) {
        const catEdge: GraphEdge = {
          id: this.generateEdgeId(
            `recurring:${rec._id}`,
            `cat:${rec.categoryId}`,
            EdgeType.CATEGORIZED_AS
          ),
          source: `recurring:${rec._id}`,
          target: `cat:${rec.categoryId}`,
          type: EdgeType.CATEGORIZED_AS,
          weight: 0.7,
          properties: { label: "categorized as" },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(catEdge);
      }
    }
  }

  // --- Derived relationship builders ---

  buildMerchantNodes(): void {
    const merchantMap = new Map<string, { count: number; totalSpent: number; txIds: string[] }>();

    for (const tx of this.transactionData) {
      const merchantName = this.extractMerchantName(tx.description);
      if (!merchantName) continue;

      const key = merchantName.toLowerCase();
      const existing = merchantMap.get(key) ?? {
        count: 0,
        totalSpent: 0,
        txIds: [],
      };
      existing.count += 1;
      if (tx.type === "expense") {
        existing.totalSpent += tx.amount;
      }
      existing.txIds.push(tx._id);
      merchantMap.set(key, existing);
    }

    for (const [key, data] of merchantMap) {
      const merchantId = `merchant:${key}`;
      const merchantNode: GraphNode<NodeType.Merchant> = {
        id: merchantId,
        type: NodeType.Merchant,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        properties: {
          name: key.charAt(0).toUpperCase() + key.slice(1),
          transactionCount: data.count,
          totalSpent: data.totalSpent,
          averageTransaction: data.count > 0 ? data.totalSpent / data.count : 0,
        },
        metadata: this.createNodeMetadata(),
      };
      this.graph.addNode(merchantNode);

      // Link transactions to merchant
      for (const txId of data.txIds) {
        const edge: GraphEdge = {
          id: this.generateEdgeId(`tx:${txId}`, merchantId, EdgeType.TRANSACTED_WITH),
          source: `tx:${txId}`,
          target: merchantId,
          type: EdgeType.TRANSACTED_WITH,
          weight: 0.6,
          properties: { label: "transacted with" },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(edge);
      }
    }
  }

  buildTimePeriodNodes(): void {
    const monthMap = new Map<string, string[]>();

    for (const tx of this.transactionData) {
      const date = new Date(tx.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`;

      if (!monthMap.has(key)) {
        monthMap.set(key, []);
      }
      monthMap.get(key)!.push(tx._id);
    }

    const sortedKeys = Array.from(monthMap.keys()).sort();
    let prevPeriodId: string | null = null;

    for (const key of sortedKeys) {
      const [yearStr, monthStr] = key.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // last day of month

      const periodId = `period:${key}`;
      const periodNode: GraphNode<NodeType.TimePeriod> = {
        id: periodId,
        type: NodeType.TimePeriod,
        label: `${startDate.toLocaleString("default", { month: "long" })} ${year}`,
        properties: {
          periodType: "month",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          label: key,
        },
        metadata: this.createNodeMetadata(),
      };
      this.graph.addNode(periodNode);

      // Link transactions to this period
      const txIds = monthMap.get(key)!;
      for (const txId of txIds) {
        const edge: GraphEdge = {
          id: this.generateEdgeId(`tx:${txId}`, periodId, EdgeType.OCCURRED_IN),
          source: `tx:${txId}`,
          target: periodId,
          type: EdgeType.OCCURRED_IN,
          weight: 0.5,
          properties: { label: "occurred in", temporal: true },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(edge);
      }

      // Link sequential periods
      if (prevPeriodId) {
        const followsEdge: GraphEdge = {
          id: this.generateEdgeId(prevPeriodId, periodId, EdgeType.FOLLOWS),
          source: prevPeriodId,
          target: periodId,
          type: EdgeType.FOLLOWS,
          weight: 0.4,
          properties: { label: "follows", temporal: true },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(followsEdge);
      }
      prevPeriodId = periodId;
    }
  }

  buildCategorySpendingEdges(): void {
    const categorySpending = new Map<string, { count: number; totalSpent: number }>();

    for (const tx of this.transactionData) {
      if (!tx.categoryId || tx.type !== "expense") continue;
      const catKey = tx.categoryId;
      const existing = categorySpending.get(catKey) ?? {
        count: 0,
        totalSpent: 0,
      };
      existing.count += 1;
      existing.totalSpent += tx.amount;
      categorySpending.set(catKey, existing);
    }

    for (const [catId, data] of categorySpending) {
      const nodeId = `cat:${catId}`;
      if (this.graph.hasNode(nodeId)) {
        this.graph.updateNode(nodeId, {
          properties: {
            ...((this.graph.getNode(nodeId)?.properties ??
              {}) as NodeProperties[NodeType.Category]),
            transactionCount: data.count,
            totalSpent: data.totalSpent,
          },
        } as Partial<GraphNode>);
      }
    }
  }

  buildBudgetAlertEdges(): void {
    for (const budget of this.budgetData) {
      if (budget.amount <= 0) continue;
      const utilization = budget.spent / budget.amount;
      if (utilization > 1.0) {
        // Over budget - create alert edge
        const overEdge: GraphEdge = {
          id: this.generateEdgeId(
            `budget:${budget._id}`,
            `user:${this.userId}`,
            EdgeType.OVER_BUDGET
          ),
          source: `budget:${budget._id}`,
          target: `user:${this.userId}`,
          type: EdgeType.OVER_BUDGET,
          weight: Math.min(utilization - 1.0, 1.0),
          properties: {
            label: "over budget",
            description: `${budget.name} is ${Math.round(utilization * 100)}% utilized`,
            strength: Math.min(utilization - 1.0, 1.0),
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(overEdge);
      }
    }
  }

  buildGoalContributionEdges(): void {
    // Link savings accounts to goals
    for (const account of this.accountData) {
      if (account.type !== "savings") continue;

      const goals = this.graph.getNodesByType(NodeType.Goal);
      for (const goal of goals) {
        const fundEdge: GraphEdge = {
          id: this.generateEdgeId(`account:${account._id}`, goal.id, EdgeType.FUNDED_BY),
          source: goal.id,
          target: `account:${account._id}`,
          type: EdgeType.FUNDED_BY,
          weight: 0.6,
          properties: {
            label: "potentially funded by",
            description: `Goal "${goal.label}" may be funded by savings account "${account.name}"`,
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(fundEdge);
      }
    }
  }

  buildInsightNodes(): void {
    // Generate insights based on data patterns
    const insights: Array<{
      title: string;
      description: string;
      insightType: string;
      confidence: number;
      isActionable: boolean;
      relatedNodes: string[];
    }> = [];

    // Insight: High spending categories
    const categories = this.graph.getNodesByType(NodeType.Category);
    for (const cat of categories) {
      const props = cat.properties as NodeProperties[NodeType.Category];
      if (props.totalSpent > 0 && props.transactionCount >= 3) {
        const avgTx = props.totalSpent / props.transactionCount;
        if (avgTx > 100) {
          insights.push({
            title: `High average spending in ${props.name}`,
            description: `Your average transaction in ${props.name} is $${avgTx.toFixed(2)} across ${props.transactionCount} transactions, totaling $${props.totalSpent.toFixed(2)}.`,
            insightType: "spending_pattern",
            confidence: 0.8,
            isActionable: true,
            relatedNodes: [cat.id],
          });
        }
      }
    }

    // Insight: Budget utilization warnings
    const budgets = this.graph.getNodesByType(NodeType.Budget);
    for (const budget of budgets) {
      const props = budget.properties as NodeProperties[NodeType.Budget];
      if (props.utilizationPercent >= 80 && props.utilizationPercent < 100) {
        insights.push({
          title: `Budget "${props.name}" approaching limit`,
          description: `You have used ${props.utilizationPercent}% of your ${props.name} budget ($${props.spent.toFixed(2)} of $${props.amount.toFixed(2)}).`,
          insightType: "budget_warning",
          confidence: 0.95,
          isActionable: true,
          relatedNodes: [budget.id],
        });
      }
    }

    // Insight: Goal progress
    const goals = this.graph.getNodesByType(NodeType.Goal);
    for (const goal of goals) {
      const props = goal.properties as NodeProperties[NodeType.Goal];
      if (props.progressPercent > 0 && props.progressPercent < 50 && props.deadline) {
        const deadline = new Date(props.deadline);
        const now = new Date();
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 90) {
          insights.push({
            title: `Goal "${props.name}" needs attention`,
            description: `You are only ${props.progressPercent}% toward your goal of $${props.targetAmount.toFixed(2)} with ${daysLeft} days remaining.`,
            insightType: "goal_progress",
            confidence: 0.9,
            isActionable: true,
            relatedNodes: [goal.id],
          });
        }
      }
    }

    // Create insight nodes and edges
    for (let i = 0; i < insights.length; i++) {
      const insight = insights[i];
      const insightId = `insight:${this.userId}:${i}`;
      const insightNode: GraphNode<NodeType.Insight> = {
        id: insightId,
        type: NodeType.Insight,
        label: insight.title,
        properties: {
          title: insight.title,
          description: insight.description,
          insightType: insight.insightType,
          confidence: insight.confidence,
          generatedAt: new Date().toISOString(),
          isActionable: insight.isActionable,
        },
        metadata: this.createNodeMetadata(),
      };
      this.graph.addNode(insightNode);

      // Link insight to related nodes
      for (const relatedId of insight.relatedNodes) {
        const derivedEdge: GraphEdge = {
          id: this.generateEdgeId(insightId, relatedId, EdgeType.DERIVED_FROM),
          source: insightId,
          target: relatedId,
          type: EdgeType.DERIVED_FROM,
          weight: insight.confidence,
          properties: {
            label: "derived from",
            strength: insight.confidence,
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: "graph-builder",
            userId: this.userId,
          },
        };
        this.graph.addEdge(derivedEdge);
      }

      // Link insight to user
      const appliesToEdge: GraphEdge = {
        id: this.generateEdgeId(insightId, `user:${this.userId}`, EdgeType.APPLIES_TO),
        source: insightId,
        target: `user:${this.userId}`,
        type: EdgeType.APPLIES_TO,
        weight: insight.confidence * 0.9,
        properties: { label: "applies to" },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: "graph-builder",
          userId: this.userId,
        },
      };
      this.graph.addEdge(appliesToEdge);
    }
  }

  buildUserProfileNode(): void {
    // Compute profile aggregates
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    // Only consider last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const tx of this.transactionData) {
      const txDate = new Date(tx.date);
      if (txDate >= thirtyDaysAgo) {
        if (tx.type === "income") {
          monthlyIncome += tx.amount;
        } else if (tx.type === "expense") {
          monthlyExpenses += tx.amount;
        }
      }
    }

    const savingsRate =
      monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0;

    const goalNames = this.graph
      .getNodesByType(NodeType.Goal)
      .map((g) => (g.properties as NodeProperties[NodeType.Goal]).name);

    const profileNode: GraphNode<NodeType.UserProfile> = {
      id: `user:${this.userId}`,
      type: NodeType.UserProfile,
      label: "User Profile",
      properties: {
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        riskTolerance: "moderate",
        financialGoals: goalNames,
      },
      metadata: this.createNodeMetadata(),
    };

    // Use addNode (will overwrite if already exists from edge references)
    this.graph.addNode(profileNode);
  }

  // --- Helpers ---

  private createNodeMetadata(): NodeMetadata {
    const now = new Date().toISOString();
    return {
      createdAt: now,
      updatedAt: now,
      source: "graph-builder",
      userId: this.userId,
      version: 1,
      accessCount: 0,
    };
  }

  generateEdgeId(source: string, target: string, type: EdgeType): string {
    return `${source}--${type}-->${target}`;
  }

  private extractMerchantName(description: string): string | undefined {
    if (!description) return undefined;
    // Simple heuristic: use the first 2-3 words of the description
    const words = description.trim().split(/\s+/);
    if (words.length === 0) return undefined;
    const name = words.slice(0, Math.min(3, words.length)).join(" ");
    return name.length > 2 ? name : undefined;
  }
}
