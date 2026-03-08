import type { Metadata } from "next";
import { AccountsPageClient } from "./accounts-page-client";

export const metadata: Metadata = {
  title: "Accounts",
  description:
    "Manage all your financial accounts in one place. Track checking, savings, credit card, and investment account balances with real-time updates.",
  openGraph: {
    title: "Accounts | WealthWise",
    description:
      "Manage all your financial accounts in one place. Track checking, savings, credit card, and investment account balances.",
    url: "/accounts",
  },
};

export default function AccountsPage() {
  return <AccountsPageClient />;
}
