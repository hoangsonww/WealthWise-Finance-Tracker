"use client";

import { useState } from "react";
import type { HoldingResponse } from "@wealthwise/shared-types";
import { useRefreshPrices } from "@/hooks/use-portfolio";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceEntry {
  id: string;
  symbol: string;
  price: string;
}

interface PriceRefreshDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdings: HoldingResponse[];
}

export function PriceRefreshDialog({ open, onOpenChange, holdings }: PriceRefreshDialogProps) {
  const refreshPrices = useRefreshPrices();

  const [entries, setEntries] = useState<PriceEntry[]>([]);

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setEntries(
        holdings.map((h) => ({
          id: h.id,
          symbol: h.symbol,
          price: String(h.currentPrice),
        }))
      );
    }
    onOpenChange(isOpen);
  }

  function updatePrice(id: string, value: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, price: value } : e))
    );
  }

  async function handleSubmit() {
    const updates = entries
      .map((e) => ({ id: e.id, currentPrice: parseFloat(e.price) }))
      .filter((u) => !isNaN(u.currentPrice) && u.currentPrice >= 0);

    if (updates.length === 0) return;

    await refreshPrices.mutateAsync({ updates });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Refresh Prices</DialogTitle>
          <DialogDescription>
            Enter the latest price for each holding. Only changed prices will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3">
              <Label className="w-20 shrink-0 font-mono text-sm font-semibold">
                {entry.symbol}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={entry.price}
                onChange={(e) => updatePrice(entry.id, e.target.value)}
                className="text-right"
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={refreshPrices.isPending}>
            {refreshPrices.isPending ? "Updating..." : "Update Prices"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
