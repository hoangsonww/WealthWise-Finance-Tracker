"use client";

import { useMemo, useState } from "react";
import { Plus, PiggyBank } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { BudgetSummary } from "@wealthwise/shared-types";
import { useBudgetSummary, useDeleteBudget } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";

export function BudgetsPageClient() {
  const [formOpen, setFormOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetSummary | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: budgets, isLoading } = useBudgetSummary();
  const { data: categories } = useCategories();
  const deleteBudget = useDeleteBudget();

  const categoryMap = useMemo(() => {
    const map = new Map<string, typeof categories extends (infer U)[] | undefined ? U : never>();
    categories?.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const chartData = useMemo(() => {
    return (
      budgets?.map((b) => ({
        name: categoryMap.get(b.categoryId)?.name ?? "Unknown",
        budget: b.amount,
        spent: b.spent,
      })) ?? []
    );
  }, [budgets, categoryMap]);

  const totalBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) ?? 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + b.spent, 0) ?? 0;

  function handleEdit(budget: BudgetSummary) {
    setEditBudget(budget);
    setFormOpen(true);
  }

  function handleDelete() {
    if (deleteId) {
      deleteBudget.mutate(deleteId);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Set spending limits and track your budget health.</p>
        </div>
        <Button
          onClick={() => {
            setEditBudget(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {/* Overview Cards */}
      {!isLoading && budgets && budgets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Budget</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Spent</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Remaining</CardDescription>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  totalBudget - totalSpent >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(totalBudget - totalSpent)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Cards Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="mb-3 h-5 w-36" />
              <Skeleton className="mb-3 h-2.5 w-full rounded-full" />
              <Skeleton className="h-3 w-28" />
            </Card>
          ))}
        </div>
      ) : !budgets || budgets.length === 0 ? (
        <Card className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <PiggyBank className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No budgets yet</h3>
            <p className="mt-1 max-w-sm text-muted-foreground">
              Create your first budget to start tracking your spending against limits.
            </p>
            <Button
              className="mt-4 gap-2"
              onClick={() => {
                setEditBudget(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create Your First Budget
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              category={categoryMap.get(budget.categoryId)}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Monthly Overview Chart */}
      {budgets && budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
            <CardDescription>Compare your budget allocations with actual spending.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Form Dialog */}
      <BudgetForm
        key={editBudget?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditBudget(null);
        }}
        budget={editBudget}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This will not affect any existing
              transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBudget.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
