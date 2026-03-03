"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { SpendingByCategory } from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";
import { COLORS } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SpendingChartProps {
  data?: SpendingByCategory[];
  isLoading?: boolean;
}

export function SpendingChart({ data, isLoading }: SpendingChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const chartData =
    data?.map((item, i) => ({
      ...item,
      fill: item.categoryColor || COLORS[i % COLORS.length],
    })) ?? [];

  const total = chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>How your expenses are distributed across categories.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No spending data for this period.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 lg:flex-row">
            <div className="h-[280px] w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="categoryName"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "13px",
                    color: "hsl(var(--foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Table */}
            <div className="w-full lg:w-1/2">
              <div className="space-y-2">
                {chartData.map((item) => (
                  <div
                    key={item.categoryId}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm">
                        {item.categoryIcon} {item.categoryName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {total > 0 ? `${Math.round((item.amount / total) * 100)}%` : "0%"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
