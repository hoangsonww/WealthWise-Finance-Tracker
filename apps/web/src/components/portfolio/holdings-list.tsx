"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import type { HoldingResponse } from "@wealthwise/shared-types";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const ASSET_CLASS_LABELS: Record<string, string> = {
  stocks: "Stocks",
  etf: "ETF",
  bonds: "Bonds",
  crypto: "Crypto",
  real_estate: "Real Estate",
  cash: "Cash",
  other: "Other",
};

const ASSET_CLASS_COLORS: Record<string, string> = {
  stocks: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  etf: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  bonds: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  crypto: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  real_estate: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  cash: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

interface HoldingsListProps {
  holdings: HoldingResponse[] | undefined;
  isLoading: boolean;
  onEdit: (holding: HoldingResponse) => void;
  onDelete: (id: string) => void;
  onRefreshPrice: (id: string, currentPrice: number) => void;
}

export function HoldingsList({
  holdings,
  isLoading,
  onEdit,
  onDelete,
  onRefreshPrice,
}: HoldingsListProps) {
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

  function startEditPrice(holding: HoldingResponse) {
    setEditingPriceId(holding.id);
    setPriceInput(String(holding.currentPrice));
  }

  function submitPriceEdit(id: string) {
    const price = parseFloat(priceInput);
    if (!isNaN(price) && price >= 0) {
      onRefreshPrice(id, price);
    }
    setEditingPriceId(null);
    setPriceInput("");
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <TrendingUp className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">No holdings yet</p>
            <p className="mt-1 text-sm">Add your first investment holding to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings ({holdings.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Asset</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Cost Basis
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Curr. Price
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Market Value
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Gain / Loss
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground" />
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr
                  key={holding.id}
                  className="group border-b transition-colors last:border-0 hover:bg-muted/30"
                >
                  {/* Asset */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold">{holding.symbol}</p>
                        <p className="max-w-[160px] truncate text-xs text-muted-foreground">
                          {holding.name}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "ml-1 shrink-0 text-xs",
                          ASSET_CLASS_COLORS[holding.assetClass]
                        )}
                      >
                        {ASSET_CLASS_LABELS[holding.assetClass]}
                      </Badge>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="px-4 py-3 text-right tabular-nums">{holding.quantity}</td>

                  {/* Cost Basis per unit */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(holding.costBasis)}
                  </td>

                  {/* Current Price (inline edit) */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {editingPriceId === holding.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitPriceEdit(holding.id);
                        }}
                        className="flex items-center justify-end gap-1"
                      >
                        <Input
                          autoFocus
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          className="h-7 w-24 text-right text-xs"
                          onBlur={() => submitPriceEdit(holding.id)}
                        />
                      </form>
                    ) : (
                      <button
                        type="button"
                        title="Click to update price"
                        onClick={() => startEditPrice(holding)}
                        className="group/price flex items-center justify-end gap-1 hover:text-primary"
                      >
                        {formatCurrency(holding.currentPrice)}
                        <RefreshCw className="h-3 w-3 opacity-0 transition-opacity group-hover/price:opacity-60" />
                      </button>
                    )}
                  </td>

                  {/* Market Value */}
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(holding.marketValue)}
                  </td>

                  {/* Gain / Loss */}
                  <td className="px-4 py-3 text-right">
                    <div
                      className={cn(
                        "flex flex-col items-end",
                        holding.gainLoss >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      <span className="flex items-center gap-1 font-medium">
                        {holding.gainLoss >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {formatCurrency(Math.abs(holding.gainLoss))}
                      </span>
                      <span className="text-xs">
                        {holding.gainLoss >= 0 ? "+" : ""}
                        {holding.gainLossPercent.toFixed(2)}%
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(holding)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(holding.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
