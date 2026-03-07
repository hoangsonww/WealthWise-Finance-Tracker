"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeftRight,
  ArrowRight,
  Clock3,
  type LucideIcon,
  Pencil,
  Repeat,
  Shield,
  Tags,
  Trash2,
  WalletCards,
} from "lucide-react";
import type { CategoryManagementResponse } from "@wealthwise/shared-types";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CategoryCardProps {
  category: CategoryManagementResponse;
  currency?: string;
  onEdit: (category: CategoryManagementResponse) => void;
  onDelete: (category: CategoryManagementResponse) => void;
}

export function CategoryCard({ category, currency, onEdit, onDelete }: CategoryCardProps) {
  const showProtectedState = !category.isDefault && !category.usage.canDelete;
  const previewBudget = category.linkedBudgets[0];
  const previewRecurring = category.linkedRecurringRules[0];
  const categoryGlyph =
    category.icon.length > 2 ? category.icon.slice(0, 2).toUpperCase() : category.icon;

  return (
    <article
      style={
        {
          "--category-color": category.color,
          "--category-color-soft": `${category.color}18`,
        } as CSSProperties
      }
      className="group relative overflow-hidden rounded-[28px] border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--category-color),transparent)]" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle_at_center,var(--category-color)_0%,transparent_70%)] opacity-20 blur-2xl" />

      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--category-color-soft)] text-lg font-semibold text-[var(--category-color)]">
              {categoryGlyph}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold">{category.name}</h3>
                <Badge variant={category.isDefault ? "secondary" : "outline"}>
                  {category.isDefault ? "Built-in" : "Custom"}
                </Badge>
                {showProtectedState && <Badge variant="warning">Protected</Badge>}
              </div>
              <p className="mt-1 text-sm capitalize text-muted-foreground">{category.type}</p>
            </div>
          </div>

          {!category.isDefault && (
            <div className="flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => onEdit(category)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  showProtectedState && "border-amber-500/30 text-amber-600"
                )}
                onClick={() => onDelete(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          <Metric
            icon={ArrowLeftRight}
            label="Transactions"
            value={String(category.usage.transactionCount)}
          />
          <Metric icon={WalletCards} label="Budgets" value={String(category.usage.budgetCount)} />
          <Metric icon={Repeat} label="Recurring" value={String(category.usage.recurringCount)} />
          <Metric
            icon={Clock3}
            label="Last used"
            value={
              category.usage.lastTransactionAt
                ? format(new Date(category.usage.lastTransactionAt), "MMM d")
                : "Never"
            }
          />
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/[0.18] p-4">
          <div className="flex flex-wrap items-center gap-2">
            {category.type === "expense" && (
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                This month {formatCurrency(category.usage.spentThisMonth, currency)}
              </Badge>
            )}
            {category.usage.canDelete && !category.isDefault && (
              <Badge variant="success" className="rounded-full px-3 py-1">
                Safe to remove
              </Badge>
            )}
            {category.isDefault && (
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Managed by WealthWise
              </Badge>
            )}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <LinkTile
              href="/budgets"
              icon={WalletCards}
              title={previewBudget ? "Budget linked" : "No budget linked"}
              description={
                previewBudget
                  ? `${previewBudget.period} cap · ${formatCurrency(previewBudget.amount, currency)}`
                  : "Create a budget to track this category proactively."
              }
            />
            <LinkTile
              href="/recurring"
              icon={previewRecurring ? Repeat : Tags}
              title={previewRecurring ? "Recurring linked" : "No recurring linked"}
              description={
                previewRecurring
                  ? `${previewRecurring.description} · ${format(
                      new Date(previewRecurring.nextDueDate),
                      "MMM d"
                    )}`
                  : "Link subscriptions, bills, or salary rules here."
              }
            />
          </div>
        </div>

        {showProtectedState && (
          <div className="bg-amber-500/8 flex items-start gap-2 rounded-2xl border border-amber-500/30 px-4 py-3 text-sm text-muted-foreground">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p>{category.deleteBlockers[0]}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 px-3 py-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 break-words text-lg font-semibold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function LinkTile({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group/link rounded-2xl border border-border/60 bg-background/80 p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <p className="font-medium">{title}</p>
        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover/link:translate-x-0.5" />
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5 shrink-0" />
        <p>{description}</p>
      </div>
    </Link>
  );
}
