import type { Metadata } from "next";
import { RecurringPageClient } from "./recurring-page-client";

export const metadata: Metadata = {
  title: "Recurring",
  description:
    "Manage recurring bills, subscriptions, and regular income. Set up automated rules, track upcoming due dates, and record payments to stay on top of your obligations.",
  openGraph: {
    title: "Recurring | WealthWise",
    description:
      "Manage recurring bills, subscriptions, and income. Set up rules, track due dates, and record payments to stay on top of your finances.",
    url: "https://wealthwisefinancial.vercel.app/recurring",
  },
};

export default function RecurringPage() {
  return <RecurringPageClient />;
}
