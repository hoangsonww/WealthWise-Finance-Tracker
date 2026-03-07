"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  PlusCircle,
  ArrowRight,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  TriangleAlert,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import {
  advisorChatRequestSchema,
  type AdvisorContextStats,
  advisorContextStatsSchema,
} from "@wealthwise/shared-types";
import { useAdvisorChat } from "@/hooks/use-advisor";
import { useAccounts } from "@/hooks/use-accounts";
import { useBudgetSummary } from "@/hooks/use-budgets";
import { useGoals } from "@/hooks/use-goals";
import { useProfile } from "@/hooks/use-profile";
import { useRecurringRules } from "@/hooks/use-recurring";
import { useTransactions } from "@/hooks/use-transactions";
import {
  AdvisorMessage,
  type AdvisorConversationMessage,
} from "@/components/advisor/advisor-message";
import { AdvisorSuggestionCard } from "@/components/advisor/advisor-suggestion-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency, generateId } from "@/lib/utils";
import { toast } from "sonner";

const advisorComposerSchema = advisorChatRequestSchema.pick({ message: true });
const ADVISOR_HISTORY_STORAGE_PREFIX = "wealthwise:advisor-history";

const advisorConversationMessageStorageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.string(),
  isError: z.boolean().optional(),
});

const advisorConversationStorageSchema = z.object({
  messages: z.array(advisorConversationMessageStorageSchema).default([]),
  latestStats: advisorContextStatsSchema.nullable().optional(),
});

type AdvisorComposerValues = z.infer<typeof advisorComposerSchema>;

const STARTER_PROMPTS = [
  {
    title: "Monthly reality check",
    description: "Ask for the clearest read on where money moved this month and what stands out.",
    prompt:
      "Give me a sharp summary of my finances this month and call out the biggest positives and risks.",
    icon: TrendingUp,
    accentClassName: "bg-emerald-500/15",
  },
  {
    title: "Spending leaks",
    description: "Find categories, habits, or recurring costs that deserve pressure testing.",
    prompt:
      "Which spending categories or recurring charges look wasteful, and what should I cut first?",
    icon: BrainCircuit,
    accentClassName: "bg-amber-500/15",
  },
  {
    title: "Goal acceleration",
    description: "Translate current cash flow into a realistic plan to hit savings targets faster.",
    prompt:
      "Based on my recent cash flow, how can I reach my top savings goal faster without overcorrecting?",
    icon: PiggyBank,
    accentClassName: "bg-sky-500/15",
  },
  {
    title: "Walk me through it",
    description: "Ask the advisor for exact in-app steps to complete a task yourself.",
    prompt:
      "Show me exactly how to add a $42.18 grocery transaction for Trader Joe's today from Main Checking into Groceries.",
    icon: PlusCircle,
    accentClassName: "bg-violet-500/15",
  },
  {
    title: "Budget risk scan",
    description: "Pressure test which envelopes look most fragile before month-end.",
    prompt: "Which budgets look most at risk this month, and what behavior should I change first?",
    icon: TriangleAlert,
    accentClassName: "bg-rose-500/15",
  },
  {
    title: "Recurring bill audit",
    description: "Spot bills, subscriptions, and autopay charges worth revisiting.",
    prompt:
      "Review my recurring bills and tell me which ones look too expensive, redundant, or easy to renegotiate.",
    icon: Clock3,
    accentClassName: "bg-cyan-500/15",
  },
  {
    title: "Cash buffer plan",
    description: "Translate live balances into a safer buffer and transfer strategy.",
    prompt:
      "How much cash should I keep liquid right now, and where is the best place to move any extra?",
    icon: WalletCards,
    accentClassName: "bg-blue-500/15",
  },
  {
    title: "Savings next move",
    description: "Ask for the highest-impact adjustment to improve savings momentum.",
    prompt:
      "What is the single best next move I can make this week to improve my savings trajectory?",
    icon: Sparkles,
    accentClassName: "bg-fuchsia-500/15",
  },
  {
    title: "Create a category",
    description: "Ask the advisor to explain the exact category workflow in the app.",
    prompt:
      "Show me exactly how to create a new expense category called Wellness for gym, supplements, and recovery costs.",
    icon: PlusCircle,
    accentClassName: "bg-orange-500/15",
  },
];

function LoadingMessage() {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-10 w-10 rounded-full border border-border/70 bg-background" />
      <div className="max-w-[85%] rounded-[28px] border border-border/70 bg-background px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Thinking through your data...
        </div>
      </div>
    </div>
  );
}

function getAdvisorHistoryStorageKey(userId: string) {
  return `${ADVISOR_HISTORY_STORAGE_PREFIX}:${userId}`;
}

function SnapshotMetric({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-background/90 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

export function AdvisorPageClient() {
  const endRef = useRef<HTMLDivElement | null>(null);
  const promptRailRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<AdvisorConversationMessage[]>([]);
  const [latestStats, setLatestStats] = useState<AdvisorContextStats | null>(null);
  const [isHistoryHydrated, setIsHistoryHydrated] = useState(false);

  const { data: profile } = useProfile();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: transactionPage, isLoading: transactionsLoading } = useTransactions({
    page: 1,
    limit: 1,
  });
  const { data: budgetSummaries, isLoading: budgetsLoading } = useBudgetSummary();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: recurringRules, isLoading: recurringLoading } = useRecurringRules();
  const advisorChat = useAdvisorChat();

  const form = useForm<AdvisorComposerValues>({
    resolver: zodResolver(advisorComposerSchema),
    defaultValues: {
      message: "",
    },
  });

  const transactionCount = transactionPage?.pagination.total ?? 0;
  const activeBudgetCount = (budgetSummaries ?? []).length;
  const recurringCount = (recurringRules ?? []).length;
  const storageKey = profile?.id ? getAdvisorHistoryStorageKey(profile.id) : null;
  const hasConversationHistory = messages.length > 0 || latestStats !== null;
  const netWorth =
    accounts?.reduce((sum, account) => {
      if (account.type === "credit_card") {
        return sum - Math.abs(account.balance);
      }

      return sum + account.balance;
    }, 0) ?? 0;

  const liveSnapshotLoading =
    accountsLoading || transactionsLoading || budgetsLoading || goalsLoading || recurringLoading;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, advisorChat.isPending]);

  useEffect(() => {
    setIsHistoryHydrated(false);

    if (!storageKey) {
      setMessages([]);
      setLatestStats(null);
      return;
    }

    try {
      const storedConversation = window.localStorage.getItem(storageKey);

      if (!storedConversation) {
        setMessages([]);
        setLatestStats(null);
        return;
      }

      const parsedConversation = advisorConversationStorageSchema.safeParse(
        JSON.parse(storedConversation)
      );

      if (!parsedConversation.success) {
        window.localStorage.removeItem(storageKey);
        setMessages([]);
        setLatestStats(null);
        return;
      }

      setMessages(parsedConversation.data.messages as AdvisorConversationMessage[]);
      setLatestStats(parsedConversation.data.latestStats ?? null);
    } catch {
      window.localStorage.removeItem(storageKey);
      setMessages([]);
      setLatestStats(null);
    } finally {
      setIsHistoryHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !isHistoryHydrated) {
      return;
    }

    if (!hasConversationHistory) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        messages,
        latestStats,
      })
    );
  }, [storageKey, isHistoryHydrated, hasConversationHistory, messages, latestStats]);

  function handleClearHistory() {
    if (!storageKey) {
      return;
    }

    window.localStorage.removeItem(storageKey);
    setMessages([]);
    setLatestStats(null);
    form.reset();
    toast.success("Advisor conversation cleared for this account.");
  }

  function scrollStarterPrompts(direction: "left" | "right") {
    promptRailRef.current?.scrollBy({
      left: direction === "right" ? 340 : -340,
      behavior: "smooth",
    });
  }

  async function submitMessage(rawMessage: string) {
    const trimmed = rawMessage.trim();
    if (!trimmed || advisorChat.isPending) {
      return;
    }

    const nextUserMessage: AdvisorConversationMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const history = messages
      .filter((message) => !message.isError)
      .slice(-12)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    setMessages((current) => [...current, nextUserMessage]);
    form.reset();

    try {
      const response = await advisorChat.mutateAsync({
        message: trimmed,
        history,
      });

      setLatestStats(response.contextStats);
      setMessages((current) => [
        ...current,
        {
          id: generateId(),
          role: "assistant",
          content: response.reply,
          createdAt: response.generatedAt,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: generateId(),
          role: "assistant",
          content:
            error instanceof Error
              ? `I couldn't analyze your data right now.\n\n${error.message}`
              : "I couldn't analyze your data right now. Please try again in a moment.",
          createdAt: new Date().toISOString(),
          isError: true,
        },
      ]);
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    await submitMessage(values.message);
  });

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[36px] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(248,250,252,0.92))] px-6 py-7 shadow-sm dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_24%),linear-gradient(135deg,rgba(10,15,22,0.92),rgba(15,23,42,0.92))] sm:px-8">
        <div className="absolute -left-10 top-6 h-36 w-36 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.1fr,0.9fr] xl:items-center">
          <div className="flex h-full flex-col justify-center space-y-5">
            <Badge variant="secondary" className="gap-1.5 self-start rounded-full px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              AI Advisor
            </Badge>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                Ask grounded questions about your money, not generic finance fluff.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                WealthWise Advisor sees your live accounts, budgets, goals, recurring bills, and the
                full transaction ledger for every chat turn. Use it to analyze spending, pressure
                test savings plans, spot the next best move, or get exact step-by-step help using
                the app.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Full transaction context
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Budget + goal aware
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Recurring bill analysis
              </Badge>
            </div>
          </div>

          <Card className="rounded-[30px] border-border/70 bg-background/80 backdrop-blur">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              {liveSnapshotLoading ? (
                <>
                  <Skeleton className="h-28 rounded-[24px]" />
                  <Skeleton className="h-28 rounded-[24px]" />
                  <Skeleton className="h-28 rounded-[24px]" />
                  <Skeleton className="h-28 rounded-[24px]" />
                </>
              ) : (
                <>
                  <SnapshotMetric
                    icon={WalletCards}
                    label="Net worth"
                    value={formatCurrency(netWorth, profile?.currency)}
                    helper="Live balance snapshot across your connected accounts."
                  />
                  <SnapshotMetric
                    icon={TrendingUp}
                    label="Transactions"
                    value={transactionCount.toLocaleString()}
                    helper="Historical records the advisor can inspect during chat."
                  />
                  <SnapshotMetric
                    icon={PiggyBank}
                    label="Budgets"
                    value={activeBudgetCount.toString()}
                    helper="Active budget envelopes shaping warnings and tradeoffs."
                  />
                  <SnapshotMetric
                    icon={Clock3}
                    label="Recurring"
                    value={recurringCount.toString()}
                    helper="Scheduled inflows and bills already factored into analysis."
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="flex min-h-[820px] flex-col overflow-hidden rounded-[32px] border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/70 bg-muted/20 pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl">Conversation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ask direct questions. The advisor will reference your live WealthWise data and
                  explain exact in-app workflows when you need them.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={advisorChat.isPending ? "warning" : "success"}
                  className="rounded-full px-3 py-1"
                >
                  {advisorChat.isPending ? "Analyzing" : "Ready"}
                </Badge>
                {latestStats && (
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    Synced {latestStats.transactionCount} transactions
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-muted-foreground"
                  onClick={handleClearHistory}
                  disabled={!storageKey || !hasConversationHistory || advisorChat.isPending}
                  aria-label="Clear advisor conversation"
                  title="Clear advisor conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col gap-6 px-6 pb-6 pt-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold tracking-tight">Prompt ideas</h3>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {STARTER_PROMPTS.length} starters
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Swipe through grounded prompts for analysis, planning, and guided in-app
                        workflows.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => scrollStarterPrompts("left")}
                        aria-label="Scroll starter prompts left"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => scrollStarterPrompts("right")}
                        aria-label="Scroll starter prompts right"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div
                    ref={promptRailRef}
                    className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2 pr-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {STARTER_PROMPTS.map((prompt) => (
                      <div
                        key={prompt.title}
                        className="flex min-w-[290px] max-w-[290px] shrink-0 snap-start"
                      >
                        <AdvisorSuggestionCard
                          icon={prompt.icon}
                          title={prompt.title}
                          prompt={prompt.prompt}
                          description={prompt.description}
                          accentClassName={prompt.accentClassName}
                          onSelect={(value) => void submitMessage(value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[30px] border border-border/70 bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted))/0.32)] p-6 shadow-sm">
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl" />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-emerald-500/20 bg-background/90 shadow-sm">
                      <div className="bg-emerald-500/12 flex h-11 w-11 items-center justify-center rounded-2xl text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="h-5.5 w-5.5" />
                      </div>
                    </div>
                    <div className="min-w-0 space-y-2.5">
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        Data-aware advice
                      </Badge>
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                          Grounded by your actual financial data
                        </h3>
                        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                          Each message is analyzed against your full transaction history plus the
                          latest account balances, budgets, goals, and recurring rules. If something
                          is missing, the advisor should tell you instead of pretending.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1">
                <ScrollArea className="h-full px-6 py-6">
                  <div className="space-y-5">
                    {messages.map((message) => (
                      <AdvisorMessage key={message.id} message={message} userName={profile?.name} />
                    ))}
                    {advisorChat.isPending && <LoadingMessage />}
                    <div ref={endRef} />
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="border-t border-border/70 bg-background/90 px-6 py-5 backdrop-blur">
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="relative">
                  <Textarea
                    rows={4}
                    placeholder="Ask about spending patterns, budget pressure, savings opportunities, or the tradeoffs in your recent cash flow..."
                    className={cn(
                      "min-h-[120px] rounded-[28px] border-border/70 pr-20 text-sm leading-6 shadow-sm",
                      form.formState.errors.message &&
                        "border-destructive/60 focus-visible:ring-destructive"
                    )}
                    disabled={advisorChat.isPending}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void onSubmit();
                      }
                    }}
                    {...form.register("message")}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute bottom-4 right-4 h-11 w-11 rounded-2xl"
                    disabled={advisorChat.isPending}
                  >
                    {advisorChat.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Shift + Enter for a new line. Press Enter to send. Ask for analysis or exact
                    step-by-step guidance through the app.
                  </p>
                  {form.formState.errors.message && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.message.message}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[32px] border-border/70 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Advisory context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestStats ? (
                <div className="grid gap-3">
                  <SnapshotMetric
                    icon={WalletCards}
                    label="Current net worth"
                    value={formatCurrency(latestStats.netWorth, latestStats.currency)}
                    helper={`Assets ${formatCurrency(latestStats.totalAssets, latestStats.currency)} • Debt ${formatCurrency(latestStats.totalDebt, latestStats.currency)}`}
                  />
                  <SnapshotMetric
                    icon={TrendingUp}
                    label="This month"
                    value={formatCurrency(latestStats.savingsThisMonth, latestStats.currency)}
                    helper={`${formatCurrency(latestStats.incomeThisMonth, latestStats.currency)} income • ${formatCurrency(latestStats.spendingThisMonth, latestStats.currency)} spent`}
                  />
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-border/70 bg-muted/10 p-5 text-sm leading-6 text-muted-foreground">
                  Your first reply will include a fresh financial snapshot from the server. I’m
                  leaving this panel empty until the advisor has actually analyzed your data for the
                  current turn.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/70 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">High-value questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Which categories are most likely to blow past budget first?",
                "What recurring bills should I renegotiate or cancel?",
                "Show me exactly how to create a weekly dining budget of $120 in this app.",
                "How much can I safely move toward savings each month?",
                "What changed in my spending pattern compared with last month?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void submitMessage(prompt)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-left text-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
                >
                  <span className="pr-4 leading-6">{prompt}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/70 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TriangleAlert className="h-5 w-5 text-warning" />
                Guardrails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                The advisor is strongest at pattern recognition, budgeting, cash-flow planning, and
                transaction-level explanation.
              </p>
              <p>
                It should flag uncertainty when data is incomplete, give exact page-and-button
                guidance when you ask how to do something, and avoid pretending to be a licensed
                tax, legal, or investment professional.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
