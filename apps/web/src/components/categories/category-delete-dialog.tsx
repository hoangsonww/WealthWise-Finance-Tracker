"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format } from "date-fns";
import { AlertTriangle, ArrowRight, Clock3, Repeat, ShieldAlert, WalletCards } from "lucide-react";
import type { CategoryManagementResponse } from "@wealthwise/shared-types";
import { useDeleteCategory } from "@/hooks/use-categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface CategoryDeleteDialogProps {
  category: CategoryManagementResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryDeleteDialog({ category, open, onOpenChange }: CategoryDeleteDialogProps) {
  const deleteCategory = useDeleteCategory();

  const suggestedDestination = useMemo(() => {
    if (!category) {
      return "/categories";
    }

    if (category.usage.budgetCount > 0) {
      return "/budgets";
    }

    if (category.usage.recurringCount > 0) {
      return "/recurring";
    }

    return "/transactions";
  }, [category]);

  async function handleDelete() {
    if (!category) {
      return;
    }

    try {
      await deleteCategory.mutateAsync(category.id);
      onOpenChange(false);
    } catch {
      // Mutations surface errors via Sonner; keep the dialog open for context.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="overflow-hidden border-border/70 p-0 sm:max-w-[520px]">
        <div className="from-red-500/12 via-orange-500/8 to-amber-500/12 border-b border-border/70 bg-gradient-to-br px-6 py-5">
          <AlertDialogHeader>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                Delete protection
              </Badge>
            </div>
            <AlertDialogTitle>
              {category?.usage.canDelete ? "Delete this category?" : "This category is protected"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {category?.usage.canDelete
                ? "Deleting it will remove it from your category library immediately."
                : "WealthWise detected linked financial records, so deleting this category would leave important history without a category reference."}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {category && (
          <div className="space-y-5 px-6 py-6">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{category.name}</p>
                  <p className="text-sm capitalize text-muted-foreground">{category.type}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {category.isDefault && <Badge variant="secondary">Built-in</Badge>}
                  {!category.isDefault && !category.usage.canDelete && (
                    <Badge variant="warning">Needs cleanup first</Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-background px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Transactions
                  </p>
                  <p className="mt-2 text-lg font-semibold">{category.usage.transactionCount}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Budgets
                  </p>
                  <p className="mt-2 text-lg font-semibold">{category.usage.budgetCount}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Recurring
                  </p>
                  <p className="mt-2 text-lg font-semibold">{category.usage.recurringCount}</p>
                </div>
              </div>
            </div>

            {!category.usage.canDelete && (
              <div className="space-y-4">
                <div className="bg-amber-500/8 rounded-2xl border border-amber-500/30 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium">What needs to be resolved first</p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {category.deleteBlockers.map((blocker) => (
                          <li key={blocker}>{blocker}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {category.linkedBudgets.length > 0 && (
                  <div className="rounded-2xl border border-border/70 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <WalletCards className="h-4 w-4 text-primary" />
                      <p className="font-medium">Linked budgets</p>
                    </div>
                    <div className="space-y-2">
                      {category.linkedBudgets.slice(0, 3).map((budget) => (
                        <div
                          key={budget.id}
                          className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2 text-sm"
                        >
                          <span className="capitalize">{budget.period} allocation</span>
                          <Badge variant={budget.isActive ? "secondary" : "outline"}>
                            {budget.isActive ? "Active" : "Paused"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {category.linkedRecurringRules.length > 0 && (
                  <div className="rounded-2xl border border-border/70 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-primary" />
                      <p className="font-medium">Linked recurring rules</p>
                    </div>
                    <div className="space-y-2">
                      {category.linkedRecurringRules.slice(0, 3).map((rule) => (
                        <div
                          key={rule.id}
                          className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">{rule.description}</p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {rule.frequency}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" />
                            {format(new Date(rule.nextDueDate), "MMM d")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter className="border-t border-border/70 px-6 py-5">
          <AlertDialogCancel>Close</AlertDialogCancel>
          {category?.usage.canDelete ? (
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete category"}
            </AlertDialogAction>
          ) : (
            <Button asChild>
              <Link href={suggestedDestination} onClick={() => onOpenChange(false)}>
                Resolve linked records
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
