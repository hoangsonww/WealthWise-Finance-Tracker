import mongoose from "mongoose";
import { Budget } from "../models/budget.model";
import { Category, ICategory } from "../models/category.model";
import { RecurringRule } from "../models/recurring-rule.model";
import { Transaction } from "../models/transaction.model";
import { ApiError } from "../utils/api-error";

type CategoryManagementResponse = {
  id: string;
  userId: string | null;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
  isDefault: boolean;
  createdAt: string;
  usage: {
    transactionCount: number;
    budgetCount: number;
    activeBudgetCount: number;
    recurringCount: number;
    activeRecurringCount: number;
    spentThisMonth: number;
    lastTransactionAt: string | null;
    canDelete: boolean;
  };
  linkedBudgets: Array<{
    id: string;
    amount: number;
    period: "monthly" | "weekly";
    alertThreshold: number;
    isActive: boolean;
  }>;
  linkedRecurringRules: Array<{
    id: string;
    description: string;
    amount: number;
    frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
    nextDueDate: string;
    isActive: boolean;
    type: "income" | "expense";
  }>;
  deleteBlockers: string[];
};

function buildDeleteBlockers(
  category: ICategory,
  usage: CategoryManagementResponse["usage"]
): string[] {
  const blockers: string[] = [];

  if (category.isDefault && category.userId === null) {
    blockers.push("Built-in categories cannot be deleted.");
  }

  if (usage.transactionCount > 0) {
    blockers.push(
      `Linked to ${usage.transactionCount} transaction${usage.transactionCount === 1 ? "" : "s"}.`
    );
  }

  if (usage.budgetCount > 0) {
    blockers.push(`Used by ${usage.budgetCount} budget${usage.budgetCount === 1 ? "" : "s"}.`);
  }

  if (usage.recurringCount > 0) {
    blockers.push(
      `Used by ${usage.recurringCount} recurring rule${usage.recurringCount === 1 ? "" : "s"}.`
    );
  }

  return blockers;
}

function formatCategory(
  category: ICategory,
  usage: CategoryManagementResponse["usage"],
  linkedBudgets: CategoryManagementResponse["linkedBudgets"],
  linkedRecurringRules: CategoryManagementResponse["linkedRecurringRules"]
): CategoryManagementResponse {
  const deleteBlockers = buildDeleteBlockers(category, usage);

  return {
    id: category._id.toString(),
    userId: category.userId ? category.userId.toString() : null,
    name: category.name,
    icon: category.icon,
    color: category.color,
    type: category.type,
    isDefault: category.isDefault,
    createdAt: category.createdAt.toISOString(),
    usage: {
      ...usage,
      canDelete: deleteBlockers.length === 0,
    },
    linkedBudgets,
    linkedRecurringRules,
    deleteBlockers,
  };
}

async function enrichCategories(
  userId: string,
  categories: ICategory[]
): Promise<CategoryManagementResponse[]> {
  if (categories.length === 0) {
    return [];
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const categoryIds = categories.map((category) => category._id);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [transactionStats, budgets, recurringRules] = await Promise.all([
    Transaction.aggregate<{
      _id: mongoose.Types.ObjectId;
      transactionCount: number;
      lastTransactionAt: Date | null;
      spentThisMonth: number;
    }>([
      {
        $match: {
          userId: userObjectId,
          categoryId: { $in: categoryIds },
        },
      },
      {
        $group: {
          _id: "$categoryId",
          transactionCount: { $sum: 1 },
          lastTransactionAt: { $max: "$date" },
          spentThisMonth: {
            $sum: {
              $cond: [
                {
                  $and: [{ $eq: ["$type", "expense"] }, { $gte: ["$date", monthStart] }],
                },
                "$amount",
                0,
              ],
            },
          },
        },
      },
    ]),
    Budget.find({
      userId: userObjectId,
      categoryId: { $in: categoryIds },
    }).sort({ isActive: -1, amount: -1 }),
    RecurringRule.find({
      userId: userObjectId,
      categoryId: { $in: categoryIds },
    }).sort({ isActive: -1, nextDueDate: 1 }),
  ]);

  const transactionMap = new Map(
    transactionStats.map((item) => [
      item._id.toString(),
      {
        transactionCount: item.transactionCount,
        lastTransactionAt: item.lastTransactionAt ? item.lastTransactionAt.toISOString() : null,
        spentThisMonth: item.spentThisMonth,
      },
    ])
  );

  const budgetMap = new Map<string, CategoryManagementResponse["linkedBudgets"]>();
  for (const budget of budgets) {
    const key = budget.categoryId.toString();
    const current = budgetMap.get(key) ?? [];
    current.push({
      id: budget._id.toString(),
      amount: budget.amount,
      period: budget.period,
      alertThreshold: budget.alertThreshold,
      isActive: budget.isActive,
    });
    budgetMap.set(key, current);
  }

  const recurringMap = new Map<string, CategoryManagementResponse["linkedRecurringRules"]>();
  for (const rule of recurringRules) {
    const key = rule.categoryId.toString();
    const current = recurringMap.get(key) ?? [];
    current.push({
      id: rule._id.toString(),
      description: rule.description,
      amount: rule.amount,
      frequency: rule.frequency,
      nextDueDate: rule.nextDueDate.toISOString(),
      isActive: rule.isActive,
      type: rule.type,
    });
    recurringMap.set(key, current);
  }

  return categories.map((category) => {
    const key = category._id.toString();
    const tx = transactionMap.get(key);
    const linkedBudgets = budgetMap.get(key) ?? [];
    const linkedRecurringRules = recurringMap.get(key) ?? [];

    return formatCategory(
      category,
      {
        transactionCount: tx?.transactionCount ?? 0,
        budgetCount: linkedBudgets.length,
        activeBudgetCount: linkedBudgets.filter((budget) => budget.isActive).length,
        recurringCount: linkedRecurringRules.length,
        activeRecurringCount: linkedRecurringRules.filter((rule) => rule.isActive).length,
        spentThisMonth: tx?.spentThisMonth ?? 0,
        lastTransactionAt: tx?.lastTransactionAt ?? null,
        canDelete: false,
      },
      linkedBudgets,
      linkedRecurringRules
    );
  });
}

async function getCategoryOrThrow(userId: string, categoryId: string) {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw ApiError.notFound("Category not found");
  }

  if (category.userId?.toString() !== userId && !(category.isDefault && category.userId === null)) {
    throw ApiError.notFound("Category not found");
  }

  return category;
}

export async function list(userId: string) {
  const categories = await Category.find({
    $or: [{ userId: null }, { userId }],
  }).sort({ type: 1, name: 1 });

  return enrichCategories(userId, categories);
}

export async function getById(userId: string, categoryId: string) {
  const category = await getCategoryOrThrow(userId, categoryId);
  const [enriched] = await enrichCategories(userId, [category]);
  return enriched;
}

export async function create(
  userId: string,
  data: {
    name: string;
    icon: string;
    color: string;
    type: "income" | "expense";
  }
) {
  const category = await Category.create({
    userId,
    ...data,
    isDefault: false,
  });

  return getById(userId, category._id.toString());
}

export async function update(
  userId: string,
  categoryId: string,
  data: {
    name?: string;
    icon?: string;
    color?: string;
    type?: "income" | "expense";
  }
) {
  const category = await getCategoryOrThrow(userId, categoryId);

  if (category.isDefault && category.userId === null) {
    throw ApiError.forbidden("System default categories cannot be modified");
  }

  if (category.userId?.toString() !== userId) {
    throw ApiError.notFound("Category not found");
  }

  await Category.findByIdAndUpdate(categoryId, { $set: data }, { runValidators: true });
  return getById(userId, categoryId);
}

export async function remove(userId: string, categoryId: string) {
  const category = await getCategoryOrThrow(userId, categoryId);

  if (category.isDefault && category.userId === null) {
    throw ApiError.forbidden("System default categories cannot be deleted");
  }

  if (category.userId?.toString() !== userId) {
    throw ApiError.notFound("Category not found");
  }

  const enriched = await getById(userId, categoryId);

  if (!enriched.usage.canDelete) {
    throw ApiError.conflict("Category cannot be deleted while it is still in use", {
      categoryId,
      deleteBlockers: enriched.deleteBlockers,
      usage: enriched.usage,
    });
  }

  await Category.findByIdAndDelete(categoryId);
  return enriched;
}
