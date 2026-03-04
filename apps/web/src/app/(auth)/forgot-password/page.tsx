import type { Metadata } from "next";
import { ForgotPasswordClient } from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your WealthWise account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
