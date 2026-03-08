"use client";

import { TrendingUp, TrendingDown, DollarSign, BarChart2 } from "lucide-react";
import type { PortfolioSummary } from "@wealthwise/shared-types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceSummaryProps {
  summary: PortfolioSummary | undefined;
  isLoading: boolean;
}

export function PerformanceSummary({ summary, isLoading }: PerformanceSummaryProps) {
  const isPositive = (summary?.totalGainLoss ?? 0) >= 0;

  const cards = [
    {
      title: "Total Market Value",
      icon: DollarSign,
      iconClass: "text-primary",
      value: formatCurrency(summary?.totalMarketValue ?? 0),
      sub: `${summary?.holdingCount ?? 0} holding${(summary?.holdingCount ?? 0) !== 1 ? "s" : ""}`,
      valueClass: "text-foreground",
    },
    {
      title: "Total Cost Basis",
      icon: BarChart2,
      iconClass: "text-muted-foreground",
      value: formatCurrency(summary?.totalCostBasis ?? 0),
      sub: "Invested capital",
      valueClass: "text-foreground",
    },
    {
      title: "Total Gain / Loss",
      icon: isPositive ? TrendingUp : TrendingDown,
      iconClass: isPositive ? "text-emerald-500" : "text-red-500",
      value: `${isPositive ? "+" : ""}${formatCurrency(summary?.totalGainLoss ?? 0)}`,
      sub: `${isPositive ? "+" : ""}${(summary?.totalGainLossPercent ?? 0).toFixed(2)}% overall`,
      valueClass: isPositive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">{card.title}</CardDescription>
            <card.icon className={cn("h-4 w-4", card.iconClass)} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <p className={cn("text-2xl font-bold", card.valueClass)}>{card.value}</p>
            )}
            {isLoading ? (
              <Skeleton className="mt-1 h-3 w-24" />
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface PortfolioEmptyProps {
  onAdd: () => void;
}

export function PortfolioEmpty({ onAdd }: PortfolioEmptyProps) {
  return (
    <Card className="py-16 text-center">
      <CardContent className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">Start tracking your portfolio</CardTitle>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add your investment holdings to see allocation breakdowns, gain/loss summaries, and more.
        </p>
        <button
          onClick={onAdd}
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Add First Holding
        </button>
      </CardContent>
    </Card>
  );
}
