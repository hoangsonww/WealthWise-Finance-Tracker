import type { Metadata } from "next";
import { CategoriesPageClient } from "./categories-page-client";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Create, organize, and protect the categories that power your WealthWise budgets, recurring rules, analytics, and transaction workflows.",
  openGraph: {
    title: "Categories | WealthWise",
    description:
      "Manage the category system behind your budgets, recurring rules, analytics, and transaction history in WealthWise.",
    url: "https://wealthwisefinancial.vercel.app/categories",
  },
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
