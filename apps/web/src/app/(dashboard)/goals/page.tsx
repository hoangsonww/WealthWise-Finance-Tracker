import type { Metadata } from "next";
import { GoalsPageClient } from "./goals-page-client";

export const metadata: Metadata = {
  title: "Goals",
  description:
    "Set and track savings goals for anything — emergency funds, vacations, home purchases, and more. Watch your progress grow as you contribute over time.",
  openGraph: {
    title: "Goals | WealthWise",
    description:
      "Set and track savings goals for anything — emergency funds, vacations, home purchases. Watch your progress grow as you contribute.",
    url: "https://wealthwisefinancial.vercel.app/goals",
  },
};

export default function GoalsPage() {
  return <GoalsPageClient />;
}
