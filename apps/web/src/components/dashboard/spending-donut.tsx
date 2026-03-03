"use client";

import { useMemo } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useSpendingByCategory } from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";
import { COLORS } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SpendingDonut() {
  const now = new Date();
  const startDate = useMemo(() => startOfMonth(now).toISOString(), []);
  const endDate = useMemo(() => endOfMonth(now).toISOString(), []);

  const { data: spending, isLoading } = useSpendingByCategory(startDate, endDate);

  const chartData = useMemo(
    () =>
      (spending ?? []).slice(0, 6).map((item, i) => ({
        name: item.categoryName,
        value: item.amount,
        fill: item.categoryColor || COLORS[i % COLORS.length],
        icon: item.categoryIcon,
      })),
    [spending]
  );

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-sm font-medium">Spending This Month</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No spending data.</p>
        ) : (
          <>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
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
                      fontSize: "12px",
                      color: "hsl(var(--foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {chartData.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-muted-foreground">
                      {item.icon} {item.name}
                    </span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Total: {formatCurrency(total)}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
