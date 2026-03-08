import type { Metadata } from "next";
import { ForgotPasswordClient } from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your WealthWise account password.",
  alternates: {
    canonical: "/forgot-password",
  },
  openGraph: {
    title: "Forgot Password | WealthWise",
    description: "Reset your WealthWise account password.",
    url: "/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
