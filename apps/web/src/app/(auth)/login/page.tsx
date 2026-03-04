import type { Metadata } from "next";
import { LoginPageClient } from "./login-page-client";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your WealthWise account to access your personal finance dashboard, track expenses, and manage your budgets.",
  openGraph: {
    title: "Sign In | WealthWise",
    description:
      "Sign in to your WealthWise account to access your personal finance dashboard, track expenses, and manage your budgets.",
    url: "https://wealthwisefinancial.vercel.app/login",
  },
};

export default function LoginPage() {
  return <LoginPageClient />;
}
