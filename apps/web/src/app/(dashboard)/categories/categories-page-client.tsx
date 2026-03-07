"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Shield,
  Tags,
  WalletCards,
  Repeat,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import type { CategoryManagementResponse } from "@wealthwise/shared-types";
import { cn, formatCurrency } from "@/lib/utils";
import { useCategories } from "@/hooks/use-categories";
import { useProfile } from "@/hooks/use-profile";
import { CategoryDeleteDialog } from "@/components/categories/category-delete-dialog";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { CategorySection } from "@/components/categories/category-section";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type CategoryView = "all" | "expense" | "income" | "custom" | "protected";

const VIEW_OPTIONS: Array<{ value: CategoryView; label: string }> = [
  { value: "all", label: "All" },
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "custom", label: "Custom" },
  { value: "protected", label: "Protected" },
];

export function CategoriesPageClient() {
  const searchParams = useSearchParams();
  const { data: categories, isLoading, isError } = useCategories();
  const { data: profile } = useProfile();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<CategoryView>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryManagementResponse | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<CategoryManagementResponse | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditCategory(null);
      setFormOpen(true);
    }
  }, [searchParams]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return (categories ?? [])
      .filter((category) => {
        switch (view) {
          case "expense":
            return category.type === "expense";
          case "income":
            return category.type === "income";
          case "custom":
            return !category.isDefault;
          case "protected":
            return !category.usage.canDelete;
          default:
            return true;
        }
      })
      .filter((category) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          category.name.toLowerCase().includes(normalizedQuery) ||
          category.icon.toLowerCase().includes(normalizedQuery) ||
          category.type.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((left, right) => {
        if (left.isDefault !== right.isDefault) {
          return Number(left.isDefault) - Number(right.isDefault);
        }

        if (left.usage.transactionCount !== right.usage.transactionCount) {
          return right.usage.transactionCount - left.usage.transactionCount;
        }

        return left.name.localeCompare(right.name);
      });
  }, [categories, deferredQuery, view]);

  const expenseCategories = filteredCategories.filter((category) => category.type === "expense");
  const incomeCategories = filteredCategories.filter((category) => category.type === "income");

  const summary = useMemo(() => {
    const allCategories = categories ?? [];
    return {
      total: allCategories.length,
      custom: allCategories.filter((category) => !category.isDefault).length,
      protected: allCategories.filter((category) => !category.usage.canDelete).length,
      activeBudgets: allCategories.filter((category) => category.usage.activeBudgetCount > 0)
        .length,
      activeRecurring: allCategories.filter((category) => category.usage.activeRecurringCount > 0)
        .length,
      monthlySpend: allCategories.reduce((sum, category) => sum + category.usage.spentThisMonth, 0),
    };
  }, [categories]);

  function openCreateDialog() {
    setEditCategory(null);
    setFormOpen(true);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-52 rounded-[32px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[28px]" />
          ))}
        </div>
        <Skeleton className="h-14 rounded-2xl" />
        <div className="grid gap-5 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-[28px]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="rounded-[28px] border-destructive/40">
        <CardContent className="pt-6">
          <EmptyState
            icon={Tags}
            title="Unable to load categories"
            description="The category library could not be fetched. Try refreshing the page."
            actionLabel="Try again"
            onAction={() => window.location.reload()}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="max-w-2xl text-muted-foreground">
              Organize the categories behind transactions, budgets, recurring rules, analytics, and
              spending alerts.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={Shapes} label="Categories" value={String(summary.total)} />
          <SummaryCard icon={Tags} label="Custom" value={String(summary.custom)} />
          <SummaryCard icon={Shield} label="Protected" value={String(summary.protected)} />
          <SummaryCard
            icon={WalletCards}
            label="Spend this month"
            value={formatCurrency(summary.monthlySpend, profile?.currency)}
          />
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="rounded-[28px] border-border/70">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, type, or icon label..."
                  className="h-12 rounded-2xl border-border/70 pl-11"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {VIEW_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setView(option.value)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      view === option.value
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/70 bg-background hover:border-primary/40 hover:bg-primary/[0.03]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border/70">
            <CardContent className="grid h-full gap-4 pt-6 sm:grid-cols-2">
              <InsightCard
                icon={WalletCards}
                label="Budget-linked"
                value={String(summary.activeBudgets)}
                description="Categories currently driving active budgets."
              />
              <InsightCard
                icon={Repeat}
                label="Recurring-linked"
                value={String(summary.activeRecurring)}
                description="Categories actively attached to recurring rules."
              />
            </CardContent>
          </Card>
        </section>

        {filteredCategories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title={categories?.length ? "No categories match those filters" : "No categories yet"}
            description={
              categories?.length
                ? "Try a broader search or switch to a different filter view."
                : "Create your first custom category to tailor WealthWise to how you think about your money."
            }
            actionLabel="Create category"
            onAction={openCreateDialog}
            className="rounded-[28px]"
          />
        ) : (
          <div className="space-y-10">
            <CategorySection
              title="Expense categories"
              description="Spending buckets used for budgets, bills, and lifestyle analysis."
              categories={expenseCategories}
              currency={profile?.currency}
              onEdit={(category) => {
                setEditCategory(category);
                setFormOpen(true);
              }}
              onDelete={setDeleteCategory}
            />

            <CategorySection
              title="Income categories"
              description="Compensation and cash inflow categories that shape your income story."
              categories={incomeCategories}
              currency={profile?.currency}
              onEdit={(category) => {
                setEditCategory(category);
                setFormOpen(true);
              }}
              onDelete={setDeleteCategory}
            />
          </div>
        )}
      </div>

      <CategoryFormDialog
        key={editCategory?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditCategory(null);
          }
        }}
        category={editCategory}
      />

      <CategoryDeleteDialog
        category={deleteCategory}
        open={!!deleteCategory}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCategory(null);
          }
        }}
      />
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-[24px] border-border/70">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-muted/[0.18] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
