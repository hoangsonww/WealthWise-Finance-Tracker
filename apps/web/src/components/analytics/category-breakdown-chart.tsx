"use client";

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
import type { CategoryMonthlyBreakdown } from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";
import { COLORS } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryBreakdownChartProps {
  data?: CategoryMonthlyBreakdown;
  isLoading?: boolean;
}

export function CategoryBreakdownChart({ data, isLoading }: CategoryBreakdownChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data && data.months.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown Over Time</CardTitle>
        <CardDescription>Top expense categories stacked by month.</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            No category data available.
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.months} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
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
                <Legend />
                {data.categories.map((cat, i) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    name={cat}
                    stackId="categories"
                    fill={data.colors[cat] ?? COLORS[i % COLORS.length]}
                  />
                ))}
                {data.months.some((m) => "Other" in m) && (
                  <Bar dataKey="Other" name="Other" stackId="categories" fill="#94a3b8" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
