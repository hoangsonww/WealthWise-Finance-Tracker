"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  BarChart3,
  FolderTree,
  Laptop,
  Moon,
  Palette,
  Sparkles,
  Sun,
} from "lucide-react";
import {
  DEFAULT_UI_PREFERENCES,
  applyUiPreferences,
  getStoredUiPreferences,
  persistUiPreferences,
  type UiPreferences,
} from "@/lib/ui-preferences";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Light",
    description: "Bright surfaces for daytime focus and dense review work.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Low-glare contrast for longer evening sessions.",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Match the appearance mode already set on your device.",
    icon: Laptop,
  },
] as const;

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<UiPreferences>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_UI_PREFERENCES;
    }

    return getStoredUiPreferences();
  });

  function updatePreferences(patch: Partial<UiPreferences>) {
    const nextPreferences = { ...preferences, ...patch };
    setPreferences(nextPreferences);
    persistUiPreferences(nextPreferences);
    applyUiPreferences(nextPreferences);
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[28px] border-border/70">
        <div className="from-sky-500/12 via-emerald-500/8 border-b border-border/70 bg-gradient-to-br to-amber-500/10 px-6 py-5">
          <CardHeader className="p-0">
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                Interface tuning
              </Badge>
            </div>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Fine-tune how WealthWise looks and feels across every screen.
            </CardDescription>
          </CardHeader>
        </div>

        <CardContent className="space-y-6 pt-6">
          <div>
            <p className="text-sm font-medium">Theme mode</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = (theme ?? "system") === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={`rounded-[24px] border p-5 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/[0.05] shadow-sm"
                        : "border-border/70 hover:border-primary/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{option.label}</p>
                        {active && <p className="text-xs text-primary">Active</p>}
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PreferenceCard
              title="Reduce motion"
              description="Trim transitions and animations for a calmer interface."
              checked={preferences.reducedMotion}
              onCheckedChange={(checked) => updatePreferences({ reducedMotion: checked })}
            />
            <PreferenceCard
              title="Higher contrast"
              description="Strengthen borders and supporting text for easier scanning."
              checked={preferences.highContrast}
              onCheckedChange={(checked) => updatePreferences({ highContrast: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Where this helps most</CardTitle>
            <CardDescription>
              Appearance changes apply globally, including categories, budgets, analytics, and the
              command palette.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickLink
              href="/categories"
              label="Category Library"
              description="Review your new management view."
              icon={FolderTree}
              accentClassName="from-emerald-500/14 via-emerald-500/8 to-transparent"
            />
            <QuickLink
              href="/analytics"
              label="Analytics"
              description="Check charts with your current contrast mode."
              icon={BarChart3}
              accentClassName="from-sky-500/14 via-sky-500/8 to-transparent"
            />
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Power-user tip</CardTitle>
            <CardDescription>
              Use the command palette to move through the app faster while keeping your preferred
              appearance settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[24px] border border-border/70 bg-muted/[0.18] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Open command palette</p>
                  <p className="text-sm text-muted-foreground">
                    Press <span className="rounded bg-background px-1.5 py-0.5 font-mono">/</span>{" "}
                    anywhere in the dashboard.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PreferenceCard({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-muted/[0.18] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  description,
  icon: Icon,
  accentClassName,
}: {
  href: string;
  label: string;
  description: string;
  icon: typeof FolderTree;
  accentClassName: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-w-0 items-start gap-4 overflow-hidden rounded-[24px] border border-border/70 bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted))/0.45)] px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-100", accentClassName)} />
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/85 text-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold tracking-tight">{label}</p>
            <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground transition-colors group-hover:text-foreground">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
