"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  BarChart3,
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  Landmark,
  Lock,
  Menu,
  Moon,
  PiggyBank,
  Repeat,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Scroll-reveal wrapper ──────────────────────────────────────────────────
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Animated counter ───────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Data ───────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: CreditCard,
    title: "Transaction Tracking",
    description:
      "Effortlessly log every transaction. Categorize, tag, and search your spending history with powerful filters and CSV import.",
    gradient: "from-indigo-500 to-blue-500",
    bg: "bg-indigo-500/10",
    text: "text-indigo-500",
  },
  {
    icon: PiggyBank,
    title: "Smart Budgets",
    description:
      "Set monthly or weekly budgets per category. Get intelligent alerts before you overspend with customizable thresholds.",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
  },
  {
    icon: Target,
    title: "Financial Goals",
    description:
      "Dream big and save smarter. Track progress toward vacation funds, emergency savings, or that new car with visual milestones.",
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-500/10",
    text: "text-violet-500",
  },
  {
    icon: BarChart3,
    title: "Rich Analytics",
    description:
      "Visualize your financial health with interactive charts. Spot trends, compare periods, and make data-driven decisions.",
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
  },
  {
    icon: Landmark,
    title: "Multi-Account",
    description:
      "Manage checking, savings, credit cards, cash, and investment accounts all in one place with real-time balance tracking.",
    gradient: "from-cyan-500 to-sky-500",
    bg: "bg-cyan-500/10",
    text: "text-cyan-500",
  },
  {
    icon: Repeat,
    title: "Recurring Rules",
    description:
      "Never miss a bill again. Set up recurring transactions with automatic scheduling and upcoming payment reminders.",
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-500/10",
    text: "text-rose-500",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create Your Account",
    description: "Sign up in seconds with email or Google. No credit card required.",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "Connect Your Accounts",
    description: "Add your bank accounts, credit cards, and investment portfolios.",
    icon: Landmark,
  },
  {
    step: "03",
    title: "Track & Categorize",
    description: "Log transactions automatically or manually. AI-powered categorization.",
    icon: Zap,
  },
  {
    step: "04",
    title: "Grow Your Wealth",
    description: "Set goals, monitor budgets, and watch your net worth climb.",
    icon: TrendingUp,
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Product Designer",
    avatar: "SC",
    color: "bg-indigo-500",
    quote:
      "WealthWise completely changed how I think about money. I went from guessing where my paycheck went to actually saving 30% every month.",
    stars: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Software Engineer",
    avatar: "MJ",
    color: "bg-emerald-500",
    quote:
      "The analytics dashboard is incredible. Being able to see spending trends over months helped me cut unnecessary subscriptions and save $200/month.",
    stars: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Freelance Writer",
    avatar: "ER",
    color: "bg-violet-500",
    quote:
      "As a freelancer with irregular income, the budget alerts are a lifesaver. I finally feel in control of my finances for the first time.",
    stars: 5,
  },
];

const STATS = [
  { value: 50, suffix: "K+", label: "Active Users" },
  { value: 2.4, suffix: "B+", label: "Dollars Tracked", prefix: "$" },
  { value: 1.2, suffix: "M+", label: "Transactions Logged" },
  { value: 99.9, suffix: "%", label: "Uptime" },
];

const TRUST_ITEMS = [
  { icon: Lock, label: "Bank-Grade Encryption" },
  { icon: Shield, label: "SOC 2 Compliant" },
  { icon: Globe, label: "GDPR Ready" },
  { icon: ShieldCheck, label: "No Data Selling" },
];

// ─── Page ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="glass fixed left-0 right-0 top-0 z-50 border-b border-border">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="whitespace-nowrap text-lg font-bold tracking-tight sm:text-xl">
                WealthWise
              </span>
            </div>

            <div className="hidden items-center gap-8 min-[890px]:flex">
              <a
                href="#features"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                How It Works
              </a>
              <a
                href="#testimonials"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Testimonials
              </a>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </button>
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="hidden cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md min-[890px]:inline-flex"
                >
                  Your Dashboard
                </Link>
              ) : (
                <div className="hidden items-center gap-2 min-[890px]:flex">
                  <Link
                    href="/login"
                    className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open menu"
                    className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground min-[890px]:hidden"
                  >
                    <Menu className="h-[1.15rem] w-[1.15rem]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {isLoggedIn ? (
                    <DropdownMenuItem className="cursor-pointer" asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link href="/login">Log in</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link href="/register">Sign Up</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-20 pt-32 sm:pb-32 sm:pt-44">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-pulse-slow absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
          <div
            className="animate-pulse-slow absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-3xl"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="animate-pulse-slow absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl"
            style={{ animationDelay: "4s" }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Reveal>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary">
                <Zap className="h-4 w-4" />
                <span>Smart finance management for everyone</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
                Take Control of{" "}
                <span className="relative">
                  <span className="text-gradient">Your Finances</span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 8.5C50 2 100 2 150 6C200 10 250 4 298 7"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="animate-draw"
                    />
                  </svg>
                </span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Track every dollar, build smarter budgets, and reach your savings goals faster.
                WealthWise gives you the clarity and tools to master your money - beautifully.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                >
                  {isLoggedIn ? "Your Dashboard" : "Get Started Free"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-muted"
                >
                  See Features
                </Link>
              </div>
            </Reveal>

            <Reveal delay={350}>
              <p className="mt-5 text-xs text-muted-foreground">
                No credit card required &middot; Free forever &middot; Cancel anytime
              </p>
            </Reveal>
          </div>

          {/* ── Hero dashboard mock ──────────────────────────────────── */}
          <Reveal delay={400} className="relative mx-auto mt-20 max-w-5xl">
            <div className="rounded-2xl border border-border bg-card/80 p-1.5 shadow-2xl ring-1 ring-black/5 backdrop-blur-sm dark:ring-white/10">
              <div className="rounded-xl bg-card p-6">
                {/* Mock header */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="h-3 w-28 rounded-full bg-muted-foreground/20" />
                    <div className="mt-2.5 h-7 w-52 rounded-lg bg-foreground/10" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 w-9 rounded-lg bg-muted" />
                    <div className="h-9 w-9 rounded-lg bg-muted" />
                    <div className="h-9 w-24 rounded-lg bg-primary/20" />
                  </div>
                </div>

                {/* Mock stat cards */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { bg: "bg-emerald-500/10", bar: "bg-emerald-500/40", w: "w-20" },
                    { bg: "bg-red-500/10", bar: "bg-red-500/40", w: "w-16" },
                    { bg: "bg-primary/10", bar: "bg-primary/40", w: "w-24" },
                    { bg: "bg-amber-500/10", bar: "bg-amber-500/40", w: "w-14" },
                  ].map((card, i) => (
                    <div key={i} className={`rounded-xl ${card.bg} p-4`}>
                      <div className="h-2.5 w-14 rounded-full bg-muted-foreground/15" />
                      <div className={`mt-3 h-5 ${card.w} rounded-lg ${card.bar}`} />
                      <div className="mt-2 h-2 w-10 rounded-full bg-muted-foreground/10" />
                    </div>
                  ))}
                </div>

                {/* Mock chart + sidebar */}
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl bg-muted/40 p-4">
                    <div className="mb-4 h-2.5 w-20 rounded-full bg-muted-foreground/15" />
                    <div className="flex items-end gap-1.5">
                      {[35, 55, 40, 70, 50, 85, 65, 80, 55, 68, 90, 45].map((h, i) => (
                        <div
                          key={i}
                          className="animate-bar-grow flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary/20"
                          style={{
                            height: `${h}px`,
                            animationDelay: `${i * 80}ms`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="hidden w-56 rounded-xl bg-muted/40 p-4 lg:block">
                    <div className="mb-4 h-2.5 w-16 rounded-full bg-muted-foreground/15" />
                    <div className="space-y-3">
                      {[
                        { w: "70%", color: "bg-indigo-400/50" },
                        { w: "55%", color: "bg-emerald-400/50" },
                        { w: "40%", color: "bg-amber-400/50" },
                        { w: "30%", color: "bg-rose-400/50" },
                        { w: "20%", color: "bg-cyan-400/50" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: item.w }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating accent cards */}
            <div className="animate-float absolute -left-6 top-1/4 hidden rounded-xl border border-border bg-card p-3.5 shadow-2xl lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">Monthly Savings</div>
                  <div className="text-sm font-bold text-emerald-500">+$1,240</div>
                </div>
              </div>
            </div>

            <div
              className="animate-float absolute -right-6 top-1/3 hidden rounded-xl border border-border bg-card p-3.5 shadow-2xl lg:block"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">Budget Status</div>
                  <div className="text-sm font-bold text-primary">On Track</div>
                </div>
              </div>
            </div>

            <div
              className="animate-float absolute -right-3 bottom-12 hidden rounded-xl border border-border bg-card p-3.5 shadow-2xl lg:block"
              style={{ animationDelay: "2s" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Bell className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">Upcoming Bill</div>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    Rent - 3 days
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Trust Bar ──────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-y border-border bg-muted/20 py-6">
        <div className="relative">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background/80 to-transparent" />
          <div className="trust-carousel flex gap-12">
            {[...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
              <div
                key={`${item.label}-${i}`}
                className="flex flex-shrink-0 items-center gap-3 px-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <span className="whitespace-nowrap text-sm font-semibold text-foreground/80">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
                Everything you need to <span className="text-gradient">manage your money</span>
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Powerful features designed to give you complete visibility and control over your
                financial life.
              </p>
            </div>
          </Reveal>

          <div className="mx-auto mt-20 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 100}>
                <div className="group relative h-full rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                  <div
                    className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative overflow-hidden bg-muted/30 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                How It Works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
                Up and running in <span className="text-gradient">minutes</span>
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Getting started with WealthWise is effortless. Four simple steps to financial
                clarity.
              </p>
            </div>
          </Reveal>

          <div className="relative mx-auto mt-20 max-w-5xl">
            {/* Connecting line */}
            <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent lg:left-1/2 lg:block lg:-translate-x-px" />

            <div className="space-y-12 lg:space-y-16">
              {STEPS.map((step, i) => (
                <Reveal key={step.step} delay={i * 150}>
                  <div
                    className={`flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-16 ${
                      i % 2 === 1 ? "lg:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Content */}
                    <div className="flex-1 space-y-3 lg:text-left">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-4xl font-extrabold text-primary/40 dark:text-primary/60">
                          {step.step}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                      <p className="max-w-md leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>

                    {/* Icon circle */}
                    <div className="relative mx-auto flex-shrink-0 lg:mx-0">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg ring-4 ring-background">
                        <step.icon className="h-9 w-9 text-primary-foreground" />
                      </div>
                    </div>

                    {/* Spacer for alternating layout */}
                    <div className="hidden flex-1 lg:block" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                By The Numbers
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
                Trusted by <span className="text-gradient">thousands</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100}>
                <div className="group rounded-2xl border border-border bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                    {stat.prefix ?? ""}
                    <Counter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section id="testimonials" className="relative bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Testimonials
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
                Loved by people who <span className="text-gradient">love their money</span>
              </h2>
            </div>
          </Reveal>

          <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <div className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  {/* Stars */}
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${t.color} text-sm font-bold text-white`}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Highlight ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-20 -left-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
            {/* Text */}
            <Reveal>
              <div className="space-y-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Smart Insights
                </p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Know exactly where your money goes
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Our analytics engine breaks down your spending into clear, actionable insights.
                  See category breakdowns, month-over-month trends, savings rates, and net worth
                  progression - all in real time.
                </p>
                <ul className="space-y-3">
                  {[
                    "Interactive spending donut charts by category",
                    "Income vs expense comparison over time",
                    "Net worth tracking with trend indicators",
                    "Export your data anytime as CSV or JSON",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <ChevronRight className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Try it free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>

            {/* Visual */}
            <Reveal delay={200}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                {/* Mini donut mock */}
                <div className="mb-6">
                  <div className="mb-4 h-3 w-32 rounded-full bg-muted-foreground/15" />
                  <div className="flex items-center justify-center">
                    <svg viewBox="0 0 120 120" className="h-40 w-40">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="16"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="16"
                        strokeDasharray="110 204"
                        strokeDashoffset="0"
                        className="animate-donut-1"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="16"
                        strokeDasharray="70 244"
                        strokeDashoffset="-110"
                        className="animate-donut-2"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="16"
                        strokeDasharray="50 264"
                        strokeDashoffset="-180"
                        className="animate-donut-3"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="16"
                        strokeDasharray="35 279"
                        strokeDashoffset="-230"
                      />
                    </svg>
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { color: "bg-indigo-500", label: "Housing", pct: "35%" },
                    { color: "bg-emerald-500", label: "Food", pct: "22%" },
                    { color: "bg-amber-500", label: "Transport", pct: "16%" },
                    { color: "bg-red-500", label: "Other", pct: "11%" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="ml-auto font-medium">{item.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-3xl rounded-3xl border border-primary/30 bg-card p-12 text-center shadow-2xl sm:p-16">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to take control?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join thousands of people who have already transformed their financial lives with
                WealthWise. Start your journey today.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Start for Free"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Free forever &middot; No credit card required
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/20 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold">WealthWise</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Smart personal finance management for everyone. Track, budget, and grow your wealth.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/terms"
                    className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://sonnguyenhoang.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    sonnguyenhoang.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/hoangsonww"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <span className="transition-colors">hoangson091104@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Global animation keyframes ─────────────────────────────────── */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes draw {
          from {
            stroke-dasharray: 0 400;
          }
          to {
            stroke-dasharray: 400 0;
          }
        }
        @keyframes bar-grow {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
        @keyframes donut-spin-1 {
          from {
            stroke-dasharray: 0 314;
          }
          to {
            stroke-dasharray: 110 204;
          }
        }
        @keyframes donut-spin-2 {
          from {
            stroke-dasharray: 0 314;
          }
          to {
            stroke-dasharray: 70 244;
          }
        }
        @keyframes donut-spin-3 {
          from {
            stroke-dasharray: 0 314;
          }
          to {
            stroke-dasharray: 50 264;
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        .animate-draw {
          animation: draw 2s ease-out forwards;
          stroke-dasharray: 0 400;
        }
        .animate-bar-grow {
          animation: bar-grow 0.8s ease-out forwards;
          transform-origin: bottom;
          transform: scaleY(0);
        }
        .animate-donut-1 {
          animation: donut-spin-1 1.5s ease-out forwards;
          stroke-dasharray: 0 314;
        }
        .animate-donut-2 {
          animation: donut-spin-2 1.5s ease-out 0.3s forwards;
          stroke-dasharray: 0 314;
        }
        .animate-donut-3 {
          animation: donut-spin-3 1.5s ease-out 0.6s forwards;
          stroke-dasharray: 0 314;
        }
        @keyframes trust-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .trust-carousel {
          animation: trust-scroll 25s linear infinite;
        }
        .trust-carousel:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
