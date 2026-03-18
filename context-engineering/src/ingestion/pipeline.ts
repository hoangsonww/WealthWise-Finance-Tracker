import mongoose from "mongoose";
import { KnowledgeGraph } from "../graph/knowledge-graph";
import { GraphBuilder } from "../graph/builder";
import { KnowledgeBase } from "../knowledge-base/knowledge-base";
import { getFinancialKnowledgeEntries } from "../knowledge-base/financial-rules";
import {
  mapAccount,
  mapTransaction,
  mapBudget,
  mapGoal,
  mapCategory,
  mapRecurring,
} from "./financial-data-mapper";
import { logger } from "../utils/logger";

// Import models from MCP (same mongoose schemas)
// We re-register them here so the package is self-contained
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModel(name: string, schema: mongoose.Schema): mongoose.Model<any> {
  try {
    return mongoose.model(name);
  } catch {
    return mongoose.model(name, schema);
  }
}

const accountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["checking", "savings", "credit_card", "cash", "investment"],
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    color: { type: String, default: "#6366f1" },
    institution: { type: String },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, required: true, enum: ["income", "expense", "transfer"] },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true },
    subcategory: { type: String },
    description: { type: String, required: true },
    notes: { type: String },
    date: { type: Date, required: true },
    isRecurring: { type: Boolean, default: false },
    recurringRuleId: { type: mongoose.Schema.Types.ObjectId },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    period: { type: String, required: true, enum: ["monthly", "weekly"] },
    alertThreshold: { type: Number, default: 0.8 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    deadline: { type: Date },
    color: { type: String, default: "#10b981" },
    icon: { type: String, default: "target" },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const categorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    type: { type: String, required: true, enum: ["income", "expense"] },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const recurringRuleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, required: true, enum: ["income", "expense"] },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    frequency: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "biweekly", "monthly", "yearly"],
    },
    startDate: { type: Date, required: true },
    nextDueDate: { type: Date, required: true },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export class IngestionPipeline {
  private mongoUri: string;
  private graph: KnowledgeGraph;
  private knowledgeBase: KnowledgeBase;
  private builder: GraphBuilder | null = null;

  constructor(mongoUri: string) {
    this.mongoUri = mongoUri;
    this.graph = new KnowledgeGraph();
    this.knowledgeBase = new KnowledgeBase();
  }

  /**
   * Full ingestion: connect to MongoDB, read all data, build graph.
   */
  async ingest(userId: string): Promise<{
    graph: KnowledgeGraph;
    knowledgeBase: KnowledgeBase;
  }> {
    logger.info({ userId }, "Starting full data ingestion");

    await this.ensureConnection();

    this.builder = new GraphBuilder(this.graph, userId);

    // Fetch all data in parallel
    const [accounts, transactions, budgets, goals, categories, recurring] = await Promise.all([
      this.fetchAccounts(userId),
      this.fetchTransactions(userId),
      this.fetchBudgets(userId),
      this.fetchGoals(userId),
      this.fetchCategories(userId),
      this.fetchRecurring(userId),
    ]);

    logger.info(
      {
        accounts: accounts.length,
        transactions: transactions.length,
        budgets: budgets.length,
        goals: goals.length,
        categories: categories.length,
        recurring: recurring.length,
      },
      "Data fetched from MongoDB"
    );

    // Build the graph
    this.builder.buildFromData({
      accounts: accounts.map(mapAccount),
      transactions: transactions.map(mapTransaction),
      budgets: budgets.map(mapBudget),
      goals: goals.map(mapGoal),
      categories: categories.map(mapCategory),
      recurring: recurring.map(mapRecurring),
    });

    // Load knowledge base
    this.loadKnowledgeBase();

    logger.info(
      {
        graphNodes: this.graph.nodeCount,
        graphEdges: this.graph.edgeCount,
        kbEntries: this.knowledgeBase.size,
      },
      "Ingestion complete"
    );

    return {
      graph: this.graph,
      knowledgeBase: this.knowledgeBase,
    };
  }

  /**
   * Partial ingestion for accounts only.
   */
  async ingestAccounts(userId: string): Promise<void> {
    await this.ensureConnection();
    this.ensureBuilder(userId);
    const accounts = await this.fetchAccounts(userId);
    this.builder!.addAccounts(accounts.map(mapAccount));
  }

  /**
   * Partial ingestion for transactions only.
   */
  async ingestTransactions(userId: string): Promise<void> {
    await this.ensureConnection();
    this.ensureBuilder(userId);
    const transactions = await this.fetchTransactions(userId);
    this.builder!.addTransactions(transactions.map(mapTransaction));
  }

  /**
   * Partial ingestion for budgets only.
   */
  async ingestBudgets(userId: string): Promise<void> {
    await this.ensureConnection();
    this.ensureBuilder(userId);
    const budgets = await this.fetchBudgets(userId);
    this.builder!.addBudgets(budgets.map(mapBudget));
  }

  /**
   * Partial ingestion for goals only.
   */
  async ingestGoals(userId: string): Promise<void> {
    await this.ensureConnection();
    this.ensureBuilder(userId);
    const goals = await this.fetchGoals(userId);
    this.builder!.addGoals(goals.map(mapGoal));
  }

  /**
   * Partial ingestion for categories only.
   */
  async ingestCategories(userId: string): Promise<void> {
    await this.ensureConnection();
    this.ensureBuilder(userId);
    const categories = await this.fetchCategories(userId);
    this.builder!.addCategories(categories.map(mapCategory));
  }

  /**
   * Partial ingestion for recurring payments only.
   */
  async ingestRecurring(userId: string): Promise<void> {
    await this.ensureConnection();
    this.ensureBuilder(userId);
    const recurring = await this.fetchRecurring(userId);
    this.builder!.addRecurringPayments(recurring.map(mapRecurring));
  }

  /**
   * Load the static financial knowledge base.
   */
  loadKnowledgeBase(): void {
    const entries = getFinancialKnowledgeEntries();
    for (const entry of entries) {
      this.knowledgeBase.addEntry(entry);
    }
    logger.info({ entries: entries.length }, "Financial knowledge base loaded");
  }

  getGraph(): KnowledgeGraph {
    return this.graph;
  }

  getKnowledgeBase(): KnowledgeBase {
    return this.knowledgeBase;
  }

  /**
   * Disconnect from MongoDB.
   */
  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      logger.info("Disconnected from MongoDB");
    } catch (error) {
      logger.error({ error }, "Failed to disconnect from MongoDB");
      throw error;
    }
  }

  // --- Private helpers ---

  private async ensureConnection(): Promise<void> {
    if (mongoose.connection.readyState === 1) return;

    try {
      await mongoose.connect(this.mongoUri);
      logger.info("Connected to MongoDB for ingestion");
    } catch (error) {
      logger.error({ error }, "Failed to connect to MongoDB");
      throw error;
    }
  }

  private ensureBuilder(userId: string): void {
    if (!this.builder) {
      this.builder = new GraphBuilder(this.graph, userId);
    }
  }

  private async fetchAccounts(userId: string): Promise<Record<string, unknown>[]> {
    const Account = getModel("Account", accountSchema);
    const docs = await Account.find({ userId: new mongoose.Types.ObjectId(userId) }).lean();
    return docs as Record<string, unknown>[];
  }

  private async fetchTransactions(userId: string): Promise<Record<string, unknown>[]> {
    const Transaction = getModel("Transaction", transactionSchema);
    const docs = await Transaction.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ date: -1 })
      .limit(500)
      .lean();
    return docs as Record<string, unknown>[];
  }

  private async fetchBudgets(userId: string): Promise<Record<string, unknown>[]> {
    const Budget = getModel("Budget", budgetSchema);
    const docs = await Budget.find({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
    }).lean();
    return docs as Record<string, unknown>[];
  }

  private async fetchGoals(userId: string): Promise<Record<string, unknown>[]> {
    const Goal = getModel("Goal", goalSchema);
    const docs = await Goal.find({ userId: new mongoose.Types.ObjectId(userId) }).lean();
    return docs as Record<string, unknown>[];
  }

  private async fetchCategories(userId: string): Promise<Record<string, unknown>[]> {
    const Category = getModel("Category", categorySchema);
    const docs = await Category.find({
      $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { isDefault: true }, { userId: null }],
    }).lean();
    return docs as Record<string, unknown>[];
  }

  private async fetchRecurring(userId: string): Promise<Record<string, unknown>[]> {
    const RecurringRule = getModel("RecurringRule", recurringRuleSchema);
    const docs = await RecurringRule.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();
    return docs as Record<string, unknown>[];
  }
}
