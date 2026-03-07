"use client";

import type { CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCategorySchema,
  updateCategorySchema,
  type CategoryManagementResponse,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@wealthwise/shared-types";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";
import { Badge } from "@/components/ui/badge";
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

const CATEGORY_ICONS = ["🛒", "🏠", "🚗", "💊", "🎬", "📚", "👕", "💰", "✈️", "🎮", "🐾", "🎵"];

const CATEGORY_COLORS = [
  "#0f766e",
  "#2563eb",
  "#f59e0b",
  "#ef4444",
  "#7c3aed",
  "#db2777",
  "#0ea5e9",
  "#16a34a",
  "#ea580c",
  "#4f46e5",
];

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryManagementResponse | null;
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const isEdit = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(isEdit ? updateCategorySchema : createCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      icon: category?.icon ?? "🛒",
      color: category?.color ?? "#0f766e",
      type: category?.type ?? "expense",
    },
  });

  const selectedIcon = form.watch("icon");
  const selectedColor = form.watch("color");
  const selectedType = form.watch("type");
  const previewGlyph =
    selectedIcon.length > 2 ? selectedIcon.slice(0, 2).toUpperCase() : selectedIcon;

  async function onSubmit(data: CreateCategoryInput) {
    if (isEdit && category) {
      await updateCategory.mutateAsync({
        id: category.id,
        data: data as UpdateCategoryInput,
      });
    } else {
      await createCategory.mutateAsync(data);
    }

    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border/70 p-0 sm:max-w-[560px]">
        <div className="from-emerald-500/12 via-sky-500/8 to-amber-500/12 border-b border-border/70 bg-gradient-to-br px-6 py-5">
          <DialogHeader>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                Category Studio
              </Badge>
            </div>
            <DialogTitle>{isEdit ? "Refine category" : "Create a new category"}</DialogTitle>
            <DialogDescription>
              Design a category that looks consistent anywhere WealthWise references it.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 py-6">
          <div className="grid gap-6 md:grid-cols-[1.4fr,0.8fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  placeholder="Groceries, Salary, Insurance..."
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    {
                      value: "expense" as const,
                      label: "Expense",
                      description: "Spend, bills, subscriptions, lifestyle.",
                    },
                    {
                      value: "income" as const,
                      label: "Income",
                      description: "Salary, side income, dividends, refunds.",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => form.setValue("type", option.value)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-all",
                        selectedType === option.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/70 hover:border-primary/40 hover:bg-muted/40"
                      )}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm font-medium">Live preview</p>
              <div className="mt-4 rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
                <div
                  style={
                    {
                      "--category-color": selectedColor,
                      "--category-color-soft": `${selectedColor}22`,
                    } as CSSProperties
                  }
                  className="rounded-2xl border border-[var(--category-color-soft)] bg-[var(--category-color-soft)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--category-color-soft)] text-sm font-semibold uppercase text-[var(--category-color)]">
                      {previewGlyph}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {form.watch("name") || "New category"}
                      </p>
                      <p className="text-sm capitalize text-muted-foreground">{selectedType}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid gap-2 sm:grid-cols-4">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => form.setValue("icon", icon)}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-lg transition-all",
                    selectedIcon === icon
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border/70 hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
            {form.formState.errors.icon && (
              <p className="text-sm text-destructive">{form.formState.errors.icon.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Accent color</Label>
            <div className="flex flex-wrap gap-3">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue("color", color)}
                  style={
                    {
                      "--swatch-color": color,
                    } as CSSProperties
                  }
                  className={cn(
                    "h-10 w-10 rounded-full border-4 border-background bg-[var(--swatch-color)] shadow-sm transition-all hover:scale-105",
                    selectedColor === color
                      ? "ring-2 ring-foreground/70 ring-offset-2 ring-offset-background"
                      : "ring-1 ring-border/60"
                  )}
                />
              ))}
            </div>
            {form.formState.errors.color && (
              <p className="text-sm text-destructive">{form.formState.errors.color.message}</p>
            )}
          </div>

          <DialogFooter className="border-t border-border/70 pt-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
              {createCategory.isPending || updateCategory.isPending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
