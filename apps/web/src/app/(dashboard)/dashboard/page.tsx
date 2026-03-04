import type { Metadata } from "next";
import { format } from "date-fns";
import { NetWorthCard } from "@/components/dashboard/net-worth-card";
import { MonthlySnapshot } from "@/components/dashboard/monthly-snapshot";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetHealth } from "@/components/dashboard/budget-health";
import { SpendingDonut } from "@/components/dashboard/spending-donut";
import { UpcomingBills } from "@/components/dashboard/upcoming-bills";
import { GoalProgress } from "@/components/dashboard/goal-progress";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your personal finance overview. See your net worth, monthly cash flow, recent transactions, budget health, and upcoming bills — all at a glance.",
  openGraph: {
    title: "Dashboard | WealthWise",
    description:
      "Your personal finance overview. See net worth, monthly cash flow, recent transactions, budget health, and upcoming bills at a glance.",
    url: "https://wealthwisefinancial.vercel.app/dashboard",
  },
};

export default function DashboardPage() {
  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground">
          Here&apos;s your financial overview for {format(new Date(), "MMMM yyyy")}.
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Row 1 */}
        <NetWorthCard />
        <MonthlySnapshot />
        <SpendingDonut />

        {/* Row 2 */}
        <RecentTransactions />
        <BudgetHealth />
        <div className="space-y-4">
          <UpcomingBills />
          <GoalProgress />
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
