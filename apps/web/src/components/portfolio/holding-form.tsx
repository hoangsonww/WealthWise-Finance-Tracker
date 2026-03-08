"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createHoldingSchema, updateHoldingSchema, assetClassEnum } from "@wealthwise/shared-types";
import type { CreateHoldingInput, UpdateHoldingInput, HoldingResponse } from "@wealthwise/shared-types";
import { useCreateHolding, useUpdateHolding } from "@/hooks/use-portfolio";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ASSET_CLASSES = assetClassEnum.options.map((value) => ({
  value,
  label:
    value === "etf"
      ? "ETF"
      : value === "real_estate"
        ? "Real Estate"
        : value.charAt(0).toUpperCase() + value.slice(1),
}));

interface HoldingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding?: HoldingResponse | null;
}

export function HoldingForm({ open, onOpenChange, holding }: HoldingFormProps) {
  const isEdit = !!holding;
  const createHolding = useCreateHolding();
  const updateHolding = useUpdateHolding();

  const form = useForm<CreateHoldingInput>({
    resolver: zodResolver(isEdit ? updateHoldingSchema : createHoldingSchema),
    defaultValues: {
      symbol: holding?.symbol ?? "",
      name: holding?.name ?? "",
      assetClass: holding?.assetClass ?? "stocks",
      quantity: holding?.quantity ?? 0,
      costBasis: holding?.costBasis ?? 0,
      currentPrice: holding?.currentPrice ?? 0,
      currency: holding?.currency ?? "USD",
      accountId: holding?.accountId ?? undefined,
      sector: holding?.sector ?? undefined,
      notes: holding?.notes ?? undefined,
    },
  });

  async function onSubmit(data: CreateHoldingInput) {
    if (isEdit && holding) {
      await updateHolding.mutateAsync({ id: holding.id, data: data as UpdateHoldingInput });
    } else {
      await createHolding.mutateAsync(data);
    }
    form.reset();
    onOpenChange(false);
  }

  const isPending = createHolding.isPending || updateHolding.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Holding" : "Add Holding"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this holding."
              : "Manually enter a new investment holding."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Symbol + Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="symbol">Ticker / Symbol</Label>
              <Input
                id="symbol"
                placeholder="e.g. AAPL"
                className="uppercase"
                {...form.register("symbol")}
              />
              {form.formState.errors.symbol && (
                <p className="text-xs text-destructive">{form.formState.errors.symbol.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" placeholder="USD" maxLength={3} {...form.register("currency")} />
              {form.formState.errors.currency && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.currency.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name / Description</Label>
            <Input
              id="name"
              placeholder="e.g. Apple Inc."
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Asset Class */}
          <div className="space-y-2">
            <Label>Asset Class</Label>
            <Select
              value={form.watch("assetClass")}
              onValueChange={(v) =>
                form.setValue("assetClass", v as CreateHoldingInput["assetClass"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select asset class" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CLASSES.map((cls) => (
                  <SelectItem key={cls.value} value={cls.value}>
                    {cls.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.assetClass && (
              <p className="text-xs text-destructive">
                {form.formState.errors.assetClass.message}
              </p>
            )}
          </div>

          {/* Quantity + Cost Basis + Current Price */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                min="0"
                placeholder="0"
                {...form.register("quantity", { valueAsNumber: true })}
              />
              {form.formState.errors.quantity && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costBasis">Cost Basis</Label>
              <Input
                id="costBasis"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("costBasis", { valueAsNumber: true })}
              />
              {form.formState.errors.costBasis && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.costBasis.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPrice">Current Price</Label>
              <Input
                id="currentPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("currentPrice", { valueAsNumber: true })}
              />
              {form.formState.errors.currentPrice && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.currentPrice.message}
                </p>
              )}
            </div>
          </div>

          {/* Sector */}
          <div className="space-y-2">
            <Label htmlFor="sector">Sector (optional)</Label>
            <Input
              id="sector"
              placeholder="e.g. Technology"
              {...form.register("sector")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any notes about this holding..."
              rows={2}
              {...form.register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update Holding" : "Add Holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
