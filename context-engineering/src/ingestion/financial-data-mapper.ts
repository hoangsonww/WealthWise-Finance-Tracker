import {
  AccountData,
  TransactionData,
  BudgetData,
  GoalData,
  CategoryData,
  RecurringData,
} from "../graph/builder";

/**
 * Maps MongoDB documents (plain objects from .lean() or toObject()) into
 * the data interfaces expected by GraphBuilder.
 */

export function mapAccount(doc: Record<string, unknown>): AccountData {
  return {
    _id: String(doc._id),
    name: String(doc.name ?? ""),
    type: String(doc.type ?? "checking"),
    balance: Number(doc.balance ?? 0),
    currency: String(doc.currency ?? "USD"),
    institution: doc.institution ? String(doc.institution) : undefined,
    isArchived: Boolean(doc.isArchived),
    userId: String(doc.userId),
  };
}

export function mapTransaction(doc: Record<string, unknown>): TransactionData {
  const date =
    doc.date instanceof Date
      ? doc.date.toISOString()
      : String(doc.date ?? new Date().toISOString());

  return {
    _id: String(doc._id),
    amount: Number(doc.amount ?? 0),
    type: String(doc.type ?? "expense"),
    description: String(doc.description ?? ""),
    date,
    categoryId: doc.categoryId ? String(doc.categoryId) : undefined,
    accountId: doc.accountId ? String(doc.accountId) : undefined,
    notes: doc.notes ? String(doc.notes) : undefined,
    tags: Array.isArray(doc.tags) ? doc.tags.map((t: unknown) => String(t)) : [],
    userId: String(doc.userId),
  };
}

export function mapBudget(doc: Record<string, unknown>): BudgetData {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    _id: String(doc._id),
    name: String(doc.name ?? `Budget ${doc._id}`),
    amount: Number(doc.amount ?? 0),
    spent: Number(doc.spent ?? 0),
    period: String(doc.period ?? "monthly"),
    startDate:
      doc.startDate instanceof Date
        ? doc.startDate.toISOString()
        : String(doc.startDate ?? startOfMonth.toISOString()),
    endDate:
      doc.endDate instanceof Date
        ? doc.endDate.toISOString()
        : String(doc.endDate ?? endOfMonth.toISOString()),
    categoryId: doc.categoryId ? String(doc.categoryId) : undefined,
    userId: String(doc.userId),
  };
}

export function mapGoal(doc: Record<string, unknown>): GoalData {
  return {
    _id: String(doc._id),
    name: String(doc.name ?? ""),
    targetAmount: Number(doc.targetAmount ?? 0),
    currentAmount: Number(doc.currentAmount ?? 0),
    deadline:
      doc.deadline instanceof Date
        ? doc.deadline.toISOString()
        : doc.deadline
          ? String(doc.deadline)
          : undefined,
    status: doc.isCompleted ? "completed" : "in_progress",
    userId: String(doc.userId),
  };
}

export function mapCategory(doc: Record<string, unknown>): CategoryData {
  return {
    _id: String(doc._id),
    name: String(doc.name ?? ""),
    icon: doc.icon ? String(doc.icon) : undefined,
    parentId: doc.parentId ? String(doc.parentId) : undefined,
    isSystem: Boolean(doc.isDefault),
    userId: doc.userId ? String(doc.userId) : undefined,
  };
}

export function mapRecurring(doc: Record<string, unknown>): RecurringData {
  return {
    _id: String(doc._id),
    name: String(doc.description ?? doc.name ?? ""),
    amount: Number(doc.amount ?? 0),
    frequency: String(doc.frequency ?? "monthly"),
    nextDueDate:
      doc.nextDueDate instanceof Date
        ? doc.nextDueDate.toISOString()
        : doc.nextDueDate
          ? String(doc.nextDueDate)
          : undefined,
    isActive: Boolean(doc.isActive ?? true),
    accountId: doc.accountId ? String(doc.accountId) : undefined,
    categoryId: doc.categoryId ? String(doc.categoryId) : undefined,
    userId: String(doc.userId),
  };
}
