"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@wealthwise/shared-types";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, User, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Extend the register schema with confirmPassword and terms
const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

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

export function RegisterPageClient() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const watchedPassword = watch("password");
  const watchedConfirm = watch("confirmPassword");
  const strength = useMemo(() => getPasswordStrength(watchedPassword ?? ""), [watchedPassword]);

  // Live mismatch: only show once the user has started typing in confirm field
  const confirmTouched = (watchedConfirm ?? "").length > 0;
  const passwordsMatch = watchedPassword === watchedConfirm;
  const showMismatch = confirmTouched && !passwordsMatch;
  const showMatch = confirmTouched && passwordsMatch;

  async function onSubmit(data: RegisterFormValues) {
    try {
      // Call the register endpoint
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        toast.error("Registration failed", {
          description: errorData?.error?.message ?? "Could not create your account.",
        });
        return;
      }

      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.success("Account created!", {
          description: "Please sign in with your new credentials.",
        });
        router.push("/login");
        return;
      }

      toast.success("Welcome to WealthWise!", {
        description: "Your account has been created successfully.",
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Start your journey to financial freedom
        </p>
      </div>

      {/* Register form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              className="pl-10"
              autoComplete="name"
              {...register("name")}
            />
          </div>
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* Email */}
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
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="pr-10"
              autoComplete="new-password"
              {...register("password")}
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
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}

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
                <span className="text-xs font-medium text-muted-foreground">{strength.label}</span>
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

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
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
              {...register("confirmPassword")}
            />
            {/* Show match/mismatch icon when typing, otherwise show/hide toggle */}
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {showMatch && <Check className="pointer-events-none h-4 w-4 text-emerald-500" />}
              {showMismatch && <X className="pointer-events-none h-4 w-4 text-destructive" />}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {showMismatch && <p className="text-xs text-destructive">Passwords do not match</p>}
          {!showMismatch && errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms */}
        <div className="space-y-1">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              {...register("acceptTerms")}
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-primary hover:text-primary/80">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-primary hover:text-primary/80">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
          Sign in
        </Link>
      </p>
    </div>
  );
}
