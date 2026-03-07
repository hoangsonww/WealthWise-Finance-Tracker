"use client";

import type { AdvisorConversationAction } from "@/components/advisor/advisor-message";
import {
  BadgeCheck,
  Ban,
  CalendarClock,
  CreditCard,
  Loader2,
  PiggyBank,
  ReceiptText,
  Shapes,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

interface AdvisorActionCardProps {
  action: AdvisorConversationAction;
  currency?: string;
  onApprove: (actionId: string) => void;
  onDismiss: (actionId: string) => void;
}

function getActionMeta(kind: AdvisorConversationAction["kind"]) {
  switch (kind) {
    case "create_transaction":
      return {
        icon: ReceiptText,
        label: "Create transaction",
      };
    case "create_budget":
      return {
        icon: PiggyBank,
        label: "Create budget",
      };
    case "create_goal":
      return {
        icon: Target,
        label: "Create goal",
      };
    case "create_category":
      return {
        icon: Shapes,
        label: "Create category",
      };
    case "create_recurring":
      return {
        icon: CalendarClock,
        label: "Create recurring",
      };
    case "create_account":
      return {
        icon: CreditCard,
        label: "Create account",
      };
  }
}

function buildActionDetails(action: AdvisorConversationAction, currency?: string) {
  switch (action.kind) {
    case "create_transaction":
      return [
        ["Type", action.data.type],
        ["Amount", formatCurrency(action.data.amount, currency)],
        ["Account", action.data.accountName],
        ["Category", action.data.categoryName],
        ["Date", action.data.date.slice(0, 10)],
      ];
    case "create_budget":
      return [
        ["Category", action.data.categoryName],
        ["Amount", formatCurrency(action.data.amount, currency)],
        ["Period", action.data.period],
        ["Alert", `${Math.round(action.data.alertThreshold * 100)}%`],
      ];
    case "create_goal":
      return [
        ["Name", action.data.name],
        ["Target", formatCurrency(action.data.targetAmount, currency)],
        ["Starting amount", formatCurrency(action.data.currentAmount, currency)],
        ["Deadline", action.data.deadline ? action.data.deadline.slice(0, 10) : "None"],
      ];
    case "create_category":
      return [
        ["Name", action.data.name],
        ["Type", action.data.type],
        ["Icon", action.data.icon],
        ["Color", action.data.color],
      ];
    case "create_recurring":
      return [
        ["Type", action.data.type],
        ["Amount", formatCurrency(action.data.amount, currency)],
        ["Frequency", action.data.frequency],
        ["Account", action.data.accountName],
        ["Category", action.data.categoryName],
      ];
    case "create_account":
      return [
        ["Name", action.data.name],
        ["Type", action.data.type],
        ["Balance", formatCurrency(action.data.balance, action.data.currency)],
        ["Currency", action.data.currency],
      ];
  }
}

export function AdvisorActionCard({
  action,
  currency,
  onApprove,
  onDismiss,
}: AdvisorActionCardProps) {
  const meta = getActionMeta(action.kind);
  const Icon = meta.icon;
  const details = buildActionDetails(action, currency);
  const isPending = action.executionState === "executing";
  const isDone = action.executionState === "done";
  const isDismissed = action.executionState === "dismissed";
  const isFailed = action.executionState === "failed";

  return (
    <div
      className={cn(
        "rounded-[26px] border bg-background/95 p-4 shadow-sm backdrop-blur",
        isDone && "border-emerald-500/30 bg-emerald-500/[0.04]",
        isFailed && "border-destructive/30 bg-destructive/[0.04]",
        isDismissed && "border-border/70 bg-muted/20"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold">{action.title}</h4>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                {meta.label}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{action.rationale}</p>
          </div>
        </div>

        <Badge
          variant={
            isDone ? "success" : isFailed ? "destructive" : isDismissed ? "outline" : "warning"
          }
          className="rounded-full px-3 py-1"
        >
          {isDone ? "Executed" : isFailed ? "Failed" : isDismissed ? "Dismissed" : "Pending"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 rounded-[22px] border border-border/70 bg-muted/20 p-4 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={`${label}-${value}`} className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value}</p>
          </div>
        ))}
      </div>

      {action.executionMessage && (
        <div
          className={cn(
            "mt-4 rounded-2xl px-4 py-3 text-sm",
            isDone && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            isFailed && "bg-destructive/10 text-destructive",
            isDismissed && "bg-muted text-muted-foreground"
          )}
        >
          {action.executionMessage}
        </div>
      )}

      {!isDone && !isDismissed && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            className="gap-2"
            disabled={isPending}
            onClick={() => onApprove(action.id)}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BadgeCheck className="h-4 w-4" />
            )}
            Confirm and run
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={isPending}
            onClick={() => onDismiss(action.id)}
          >
            <Ban className="h-4 w-4" />
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
