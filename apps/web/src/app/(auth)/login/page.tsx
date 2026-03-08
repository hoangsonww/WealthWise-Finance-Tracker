import type { Metadata } from "next";
import { LoginPageClient } from "./login-page-client";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your WealthWise account to access your personal finance dashboard, track expenses, and manage your budgets.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Sign In | WealthWise",
    description:
      "Sign in to your WealthWise account to access your personal finance dashboard, track expenses, and manage your budgets.",
    url: "/login",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | WealthWise",
    description:
      "Sign in to your WealthWise account to access your personal finance dashboard, track expenses, and manage your budgets.",
  },
};

export default function LoginPage() {
  return <LoginPageClient />;
}
