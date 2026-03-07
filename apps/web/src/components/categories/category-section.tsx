"use client";

import type { CategoryManagementResponse } from "@wealthwise/shared-types";
import { CategoryCard } from "@/components/categories/category-card";

interface CategorySectionProps {
  title: string;
  description: string;
  categories: CategoryManagementResponse[];
  currency?: string;
  onEdit: (category: CategoryManagementResponse) => void;
  onDelete: (category: CategoryManagementResponse) => void;
}

export function CategorySection({
  title,
  description,
  categories,
  currency,
  onEdit,
  onDelete,
}: CategorySectionProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {categories.length} categor{categories.length === 1 ? "y" : "ies"}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            currency={currency}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
