import type { Metadata } from "next";
import { RegisterPageClient } from "./register-page-client";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your free WealthWise account and start taking control of your personal finances today. Track expenses, set budgets, and reach your savings goals.",
  alternates: {
    canonical: "/register",
  },
  openGraph: {
    title: "Create Account | WealthWise",
    description:
      "Create your free WealthWise account and start taking control of your personal finances today. Track expenses, set budgets, and reach your savings goals.",
    url: "/register",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Account | WealthWise",
    description:
      "Create your free WealthWise account and start taking control of your personal finances today. Track expenses, set budgets, and reach your savings goals.",
  },
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
