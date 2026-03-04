import type { Metadata } from "next";
import { BudgetsPageClient } from "./budgets-page-client";

export const metadata: Metadata = {
  title: "Budgets",
  description:
    "Create monthly spending budgets by category, track your progress in real time, and get visual insights into where your money is going versus your plan.",
  openGraph: {
    title: "Budgets | WealthWise",
    description:
      "Create monthly spending budgets by category, track progress in real time, and visualize spending versus your plan.",
    url: "https://wealthwisefinancial.vercel.app/budgets",
  },
};

export default function BudgetsPage() {
  return <BudgetsPageClient />;
}
