"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowLeftRight,
  BarChart3,
  Calculator,
  Landmark,
  LayoutDashboard,
  Moon,
  PiggyBank,
  Plus,
  Repeat,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  Tags,
  User,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Listen for "/" key (not inside an input/textarea)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <>
      {/* Trigger button (replaces the old static one) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted sm:w-64 sm:justify-start sm:px-3"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
          /
        </kbd>
      </button>

      {/* Command palette */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Pages">
            <CommandItem onSelect={() => go("/dashboard")}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => go("/transactions")}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transactions
            </CommandItem>
            <CommandItem onSelect={() => go("/budgets")}>
              <PiggyBank className="mr-2 h-4 w-4" />
              Budgets
            </CommandItem>
            <CommandItem onSelect={() => go("/categories")}>
              <Tags className="mr-2 h-4 w-4" />
              Categories
            </CommandItem>
            <CommandItem onSelect={() => go("/goals")}>
              <Target className="mr-2 h-4 w-4" />
              Goals
            </CommandItem>
            <CommandItem onSelect={() => go("/accounts")}>
              <Landmark className="mr-2 h-4 w-4" />
              Accounts
            </CommandItem>
            <CommandItem onSelect={() => go("/recurring")}>
              <Repeat className="mr-2 h-4 w-4" />
              Recurring
            </CommandItem>
            <CommandItem onSelect={() => go("/analytics")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </CommandItem>
            <CommandItem onSelect={() => go("/advisor")}>
              <Sparkles className="mr-2 h-4 w-4" />
              AI Advisor
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => go("/transactions?action=new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </CommandItem>
            <CommandItem onSelect={() => go("/budgets?action=new")}>
              <Calculator className="mr-2 h-4 w-4" />
              New Budget
            </CommandItem>
            <CommandItem onSelect={() => go("/categories?action=new")}>
              <Tags className="mr-2 h-4 w-4" />
              New Category
            </CommandItem>
            <CommandItem onSelect={() => go("/goals?action=new")}>
              <Target className="mr-2 h-4 w-4" />
              New Goal
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => go("/settings?tab=profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </CommandItem>
            <CommandItem onSelect={() => go("/settings?tab=appearance")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme(theme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
            >
              {theme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              Toggle {theme === "dark" ? "Light" : "Dark"} Mode
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
