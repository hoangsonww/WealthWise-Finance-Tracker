"use client";

import { useState } from "react";
import { Plus, Download, RefreshCw } from "lucide-react";
import type { HoldingResponse } from "@wealthwise/shared-types";
import {
  useHoldings,
  usePortfolioSummary,
  useDeleteHolding,
  useRefreshPrices,
} from "@/hooks/use-portfolio";
import { Button } from "@/components/ui/button";
import { HoldingsList } from "@/components/portfolio/holdings-list";
import { HoldingForm } from "@/components/portfolio/holding-form";
import { AllocationChart } from "@/components/portfolio/allocation-chart";
import { PerformanceSummary, PortfolioEmpty } from "@/components/portfolio/performance-summary";
import { format } from "date-fns";

export function PortfolioPageClient() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<HoldingResponse | null>(null);

  const { data: holdings, isLoading: holdingsLoading } = useHoldings();
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary();
  const deleteHolding = useDeleteHolding();
  const refreshPrices = useRefreshPrices();

  function openCreate() {
    setEditingHolding(null);
    setFormOpen(true);
  }

  function openEdit(holding: HoldingResponse) {
    setEditingHolding(holding);
    setFormOpen(true);
  }

  function handleDelete(id: string) {
    deleteHolding.mutate(id);
  }

  function handleRefreshPrice(id: string, currentPrice: number) {
    refreshPrices.mutate({ updates: [{ id, currentPrice }] });
  }

  function handleExportCsv() {
    if (!holdings || holdings.length === 0) return;
    const rows = [
      "Symbol,Name,Asset Class,Quantity,Cost Basis,Current Price,Market Value,Gain/Loss,Gain/Loss %,Currency",
      ...holdings.map(
        (h) =>
          `${h.symbol},"${h.name}",${h.assetClass},${h.quantity},${h.costBasis},${h.currentPrice},${h.marketValue},${h.gainLoss},${h.gainLossPercent}%,${h.currency}`
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isEmpty = !holdingsLoading && (!holdings || holdings.length === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground">
            Track your investment holdings, allocation, and performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!holdings || holdings.length === 0}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!holdings || holdings.length === 0) return;
              // Dummy bulk refresh — clicking opens the inline editor per row
            }}
            title="Update prices inline by clicking each current price cell"
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Prices
          </Button>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Holding
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <PortfolioEmpty onAdd={openCreate} />
      ) : (
        <>
          {/* Performance summary cards */}
          <PerformanceSummary summary={summary} isLoading={summaryLoading} />

          {/* Holdings table + allocation chart */}
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <HoldingsList
              holdings={holdings}
              isLoading={holdingsLoading}
              onEdit={openEdit}
              onDelete={handleDelete}
              onRefreshPrice={handleRefreshPrice}
            />
            <AllocationChart allocation={summary?.allocation} isLoading={summaryLoading} />
          </div>
        </>
      )}

      {/* Create/Edit dialog */}
      <HoldingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        holding={editingHolding}
      />
    </div>
  );
}
