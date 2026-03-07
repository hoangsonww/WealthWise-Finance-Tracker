"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
  Wallet,
} from "lucide-react";
import { cn, getInitials, formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/constants";
import { usePathname } from "next/navigation";
import { SearchCommand } from "@/components/layout/search-command";
import { useBudgetSummary } from "@/hooks/use-budgets";
import { useUpcomingBills } from "@/hooks/use-recurring";
import { format, differenceInDays } from "date-fns";

function NotificationsPopover() {
  const { data: budgetSummaries } = useBudgetSummary();
  const { data: upcomingBills } = useUpcomingBills();

  const budgetAlerts = (budgetSummaries ?? []).filter(
    (b) => b.status === "warning" || b.status === "over_budget"
  );
  const billsDueSoon = (upcomingBills ?? []).filter((r) => {
    const days = differenceInDays(new Date(r.nextDueDate), new Date());
    return days >= 0 && days <= 7;
  });

  const totalCount = budgetAlerts.length + billsDueSoon.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {totalCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {totalCount > 9 ? "9+" : totalCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground">{totalCount} new</span>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-96">
          {totalCount === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCheck className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {budgetAlerts.map((b) => (
                <Link
                  key={b.id}
                  href="/budgets"
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {b.status === "over_budget" ? "Budget exceeded" : "Budget warning"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.categoryId} - {Math.round(b.percentage * 100)}% used
                    </p>
                  </div>
                </Link>
              ))}
              {billsDueSoon.map((bill) => {
                const days = differenceInDays(new Date(bill.nextDueDate), new Date());
                return (
                  <Link
                    key={bill.id}
                    href="/recurring"
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning/10">
                      <CalendarClock className="h-4 w-4 text-warning" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{bill.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(bill.amount)} due{" "}
                        {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}
                        {" · "}
                        {format(new Date(bill.nextDueDate), "MMM d")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {totalCount > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Link
                href="/recurring"
                className="flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                View all
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Mobile menu button */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border px-4 py-4">
            <SheetTitle className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">WealthWise</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Search bar / command palette */}
      <div className="ml-2 flex flex-1 items-center md:ml-0">
        <SearchCommand />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <NotificationsPopover />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 text-muted-foreground transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 text-muted-foreground transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User dropdown - mobile only; desktop uses sidebar bottom section */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session?.user?.image ?? undefined}
                    alt={session?.user?.name ?? "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(session?.user?.name ?? "U")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings?tab=profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings?tab=appearance" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
