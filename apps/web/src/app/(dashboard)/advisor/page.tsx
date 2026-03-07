import type { Metadata } from "next";
import { AdvisorPageClient } from "./advisor-page-client";

export const metadata: Metadata = {
  title: "AI Advisor",
  description:
    "Chat with the WealthWise AI Advisor using your live accounts, budgets, goals, recurring bills, and full transaction history.",
  openGraph: {
    title: "AI Advisor | WealthWise",
    description:
      "Use WealthWise AI Advisor to analyze spending, savings, budgets, and recurring bills with your real financial data.",
    url: "https://wealthwisefinancial.vercel.app/advisor",
  },
};

export default function AdvisorPage() {
  return <AdvisorPageClient />;
}
