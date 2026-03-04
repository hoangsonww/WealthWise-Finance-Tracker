"use client";

import { useMemo, useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  useSpendingByCategory,
  useIncomeVsExpense,
  useMonthlySummary,
  useTrends,
  useNetWorth,
  useSpendingByDayOfWeek,
  useCategoryMonthlyBreakdown,
} from "@/hooks/use-analytics";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SpendingChart } from "@/components/analytics/spending-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { NetWorthChart } from "@/components/analytics/net-worth-chart";
import { SavingsRateChart } from "@/components/analytics/savings-rate-chart";
import { CashFlowChart } from "@/components/analytics/cash-flow-chart";
import { CumulativeSavingsChart } from "@/components/analytics/cumulative-savings-chart";
import { DayOfWeekChart } from "@/components/analytics/day-of-week-chart";
import { CategoryBreakdownChart } from "@/components/analytics/category-breakdown-chart";

type DateRange = "1m" | "3m" | "6m" | "12m";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "1m", label: "Last Month" },
  { value: "3m", label: "Last 3 Months" },
  { value: "6m", label: "Last 6 Months" },
  { value: "12m", label: "Last 12 Months" },
];

const rangeToMonths: Record<DateRange, number> = {
  "1m": 1,
  "3m": 3,
  "6m": 6,
  "12m": 12,
};

export function AnalyticsPageClient() {
  const [dateRange, setDateRange] = useState<DateRange>("6m");

  const months = rangeToMonths[dateRange];
  const startDate = useMemo(
    () => startOfMonth(subMonths(new Date(), months)).toISOString(),
    [months]
  );
  const endDate = useMemo(() => endOfMonth(new Date()).toISOString(), []);

  const now = new Date();

  const { data: spending, isLoading: spendingLoading } = useSpendingByCategory(startDate, endDate);
  const { data: incomeVsExpense, isLoading: trendLoading } = useIncomeVsExpense(months);
  const { data: summary, isLoading: summaryLoading } = useMonthlySummary(
    now.getFullYear(),
    now.getMonth() + 1
  );
  const { data: trends, isLoading: trendsLoading } = useTrends(months);
  const { data: netWorth, isLoading: netWorthLoading } = useNetWorth();
  const { data: dayOfWeek, isLoading: dayOfWeekLoading } = useSpendingByDayOfWeek(
    startDate,
    endDate
  );
  const { data: categoryBreakdown, isLoading: categoryBreakdownLoading } =
    useCategoryMonthlyBreakdown(months);

  function handleExport() {
    const csvRows = [
      "Month,Income,Expense,Net,Savings Rate",
      ...(incomeVsExpense?.map(
        (d) =>
          `${d.month},${d.income},${d.expense},${d.net},${
            d.income > 0 ? (((d.income - d.expense) / d.income) * 100).toFixed(1) : "0"
          }%`
      ) ?? []),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wealthwise-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into your financial health.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Total Income</CardDescription>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary?.totalIncome ?? 0)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Total Expenses</CardDescription>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary?.totalExpenses ?? 0)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Net Savings</CardDescription>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p
                className={cn(
                  "text-2xl font-bold",
                  (summary?.netSavings ?? 0) >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {formatCurrency(summary?.netSavings ?? 0)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Savings rate: {summary ? `${Math.round(summary.savingsRate)}%` : "--"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SpendingChart data={spending} isLoading={spendingLoading} />
        <TrendChart data={incomeVsExpense} isLoading={trendLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowChart data={incomeVsExpense} isLoading={trendLoading} />
        <SavingsRateChart data={trends} isLoading={trendsLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <NetWorthChart data={netWorth} isLoading={netWorthLoading} />
        <CumulativeSavingsChart data={incomeVsExpense} isLoading={trendLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryBreakdownChart data={categoryBreakdown} isLoading={categoryBreakdownLoading} />
        <DayOfWeekChart data={dayOfWeek} isLoading={dayOfWeekLoading} />
      </div>
    </div>
  );
}
