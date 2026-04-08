"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { HoldingAllocation } from "@wealthwise/shared-types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ALLOCATION_COLORS: Record<string, string> = {
  stocks: "#6366f1",
  etf: "#8b5cf6",
  bonds: "#10b981",
  crypto: "#f59e0b",
  real_estate: "#06b6d4",
  cash: "#84cc16",
  other: "#94a3b8",
};

const ASSET_CLASS_LABELS: Record<string, string> = {
  stocks: "Stocks",
  etf: "ETF",
  bonds: "Bonds",
  crypto: "Crypto",
  real_estate: "Real Estate",
  cash: "Cash",
  other: "Other",
};

interface AllocationChartProps {
  allocation: HoldingAllocation[] | undefined;
  isLoading: boolean;
}

interface TooltipPayload {
  name: string;
  value: number;
  payload: HoldingAllocation & { fill: string };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border bg-background p-2.5 shadow-md text-sm">
      <p className="font-semibold">{ASSET_CLASS_LABELS[entry.name] ?? entry.name}</p>
      <p className="text-muted-foreground">
        {formatCurrency(entry.value)} &bull; {entry.payload.percentage.toFixed(1)}%
      </p>
    </div>
  );
}

export function AllocationChart({ allocation, isLoading }: AllocationChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="mx-auto h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!allocation || allocation.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No allocation data available.
        </CardContent>
      </Card>
    );
  }

  const chartData = allocation.map((item) => ({
    ...item,
    fill: ALLOCATION_COLORS[item.assetClass] ?? "#94a3b8",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                nameKey="assetClass"
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.assetClass} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-1 flex-col gap-2">
            {chartData.map((entry) => (
              <div key={entry.assetClass} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      entry.percentage >= 50 ? "font-semibold" : "font-normal"
                    )}
                  >
                    {ASSET_CLASS_LABELS[entry.assetClass] ?? entry.assetClass}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{entry.percentage.toFixed(1)}%</span>
                  <p className="text-xs text-muted-foreground">{formatCurrency(entry.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
