"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPasswordSchema, resetPasswordSchema } from "@wealthwise/shared-types";
import type { ForgotPasswordInput } from "@wealthwise/shared-types";
import { toast } from "sonner";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// ---------------------------------------------------------------------------
// Step 2 schema — email is carried from state; only password fields live here
// ---------------------------------------------------------------------------

const resetFormSchema = resetPasswordSchema
  .omit({ email: true })
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormValues = z.infer<typeof resetFormSchema>;

// ---------------------------------------------------------------------------
// Password strength helpers (identical to register page)
// ---------------------------------------------------------------------------

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length;

  if (password.length === 0) return { score: 0, label: "", color: "" };
  if (passed <= 1) return { score: 25, label: "Weak", color: "bg-destructive" };
  if (passed === 2) return { score: 50, label: "Fair", color: "bg-amber-500" };
  if (passed === 3) return { score: 75, label: "Good", color: "bg-emerald-400" };
  return { score: 100, label: "Strong", color: "bg-emerald-500" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Step = "email" | "reset";

export function ForgotPasswordClient() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Step 1 form ────────────────────────────────────────────────────────────
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: isEmailSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  // ── Step 2 form ────────────────────────────────────────────────────────────
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    watch,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const watchedPassword = watch("password");
  const watchedConfirm = watch("confirmPassword");
  const strength = useMemo(() => getPasswordStrength(watchedPassword ?? ""), [watchedPassword]);

  // Live confirm-field feedback (matches register page behaviour)
  const confirmTouched = (watchedConfirm ?? "").length > 0;
  const passwordsMatch = watchedPassword === watchedConfirm;
  const showMismatch = confirmTouched && !passwordsMatch;
  const showMatch = confirmTouched && passwordsMatch;

  // ── Submit handlers ────────────────────────────────────────────────────────

  async function onEmailSubmit(data: ForgotPasswordInput) {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (response.status === 404) {
        toast.error("No account found with that email address");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        toast.error("Something went wrong", {
          description: errorData?.error?.message ?? "Please try again.",
        });
        return;
      }

      setVerifiedEmail(data.email);
      setStep("reset");
    } catch {
      toast.error("Something went wrong", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  }

  async function onResetSubmit(data: ResetFormValues) {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifiedEmail, password: data.password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        toast.error("Password reset failed", {
          description: errorData?.error?.message ?? "Could not reset your password.",
        });
        return;
      }

      toast.success("Password reset successfully");
      router.push("/login");
    } catch {
      toast.error("Something went wrong", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
      {/* Card header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {step === "email"
            ? "Enter your email address to verify your account"
            : "Create a new password for your account"}
        </p>
      </div>

      {/* Step 2 success callout — confirms the user cleared step 1 */}
      {step === "reset" && (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Account verified. Please set your new password.
          </p>
        </div>
      )}

      {/* ── Step 1: Verify email ────────────────────────────────────────────── */}
      {step === "email" && (
        <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                autoComplete="email"
                {...registerEmail("email")}
              />
            </div>
            {emailErrors.email && (
              <p className="text-xs text-destructive">{emailErrors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isEmailSubmitting}>
            {isEmailSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Verify account"
            )}
          </Button>
        </form>
      )}

      {/* ── Step 2: Set new password ────────────────────────────────────────── */}
      {step === "reset" && (
        <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
          {/* New password */}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                className="pr-10"
                autoComplete="new-password"
                {...registerReset("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {resetErrors.password && (
              <p className="text-xs text-destructive">{resetErrors.password.message}</p>
            )}

            {/* Password strength indicator */}
            {watchedPassword && watchedPassword.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        strength.color
                      )}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(watchedPassword);
                    return (
                      <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                        {passed ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground/50" />
                        )}
                        <span
                          className={cn(
                            "transition-colors",
                            passed
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground/60"
                          )}
                        >
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Confirm new password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                className={cn(
                  "pr-10",
                  showMismatch && "border-destructive focus-visible:ring-destructive",
                  showMatch && "border-emerald-500 focus-visible:ring-emerald-500"
                )}
                autoComplete="new-password"
                {...registerReset("confirmPassword")}
              />
              {/* Match / mismatch icon + show-password toggle */}
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {showMatch && <Check className="pointer-events-none h-4 w-4 text-emerald-500" />}
                {showMismatch && <X className="pointer-events-none h-4 w-4 text-destructive" />}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {showMismatch && <p className="text-xs text-destructive">Passwords do not match</p>}
            {!showMismatch && resetErrors.confirmPassword && (
              <p className="text-xs text-destructive">{resetErrors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isResetSubmitting}>
            {isResetSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting password…
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </form>
      )}

      {/* Back to sign in */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
