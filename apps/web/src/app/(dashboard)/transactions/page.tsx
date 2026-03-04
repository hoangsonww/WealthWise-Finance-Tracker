import type { Metadata } from "next";
import { TransactionsPageClient } from "./transactions-page-client";

export const metadata: Metadata = {
  title: "Transactions",
  description:
    "View, search, filter, and manage all your income and expense transactions. Import from CSV or add entries manually to keep your records up to date.",
  openGraph: {
    title: "Transactions | WealthWise",
    description:
      "View, search, filter, and manage all your income and expense transactions. Import from CSV or add entries manually.",
    url: "https://wealthwisefinancial.vercel.app/transactions",
  },
};

export default function TransactionsPage() {
  return <TransactionsPageClient />;
}
