import type { Metadata } from "next";
import { AnalyticsPageClient } from "./analytics-page-client";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Explore deep financial analytics including spending by category, income versus expenses, net worth trends, savings rate, cash flow, and day-of-week spending patterns.",
  openGraph: {
    title: "Analytics | WealthWise",
    description:
      "Explore deep financial analytics — spending by category, income vs expenses, net worth trends, savings rate, and cash flow charts.",
    url: "https://wealthwisefinancial.vercel.app/analytics",
  },
};

export default function AnalyticsPage() {
  return <AnalyticsPageClient />;
}
