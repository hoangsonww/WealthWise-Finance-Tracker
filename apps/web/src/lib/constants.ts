import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  PiggyBank,
  Target,
  Landmark,
  Repeat,
  BarChart3,
  Sparkles,
  Settings,
  Wallet,
  Building2,
  CreditCard,
  Banknote,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Budgets", href: "/budgets", icon: PiggyBank },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Accounts", href: "/accounts", icon: Landmark },
  { label: "Recurring", href: "/recurring", icon: Repeat },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "AI Advisor", href: "/advisor", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Budgets", href: "/budgets", icon: PiggyBank },
  { label: "Goals", href: "/goals", icon: Target },
];

// ---------------------------------------------------------------------------
// Account types
// ---------------------------------------------------------------------------

export interface AccountTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const ACCOUNT_TYPES: Record<string, AccountTypeConfig> = {
  checking: { label: "Checking", icon: Building2, color: "#6366f1" },
  savings: { label: "Savings", icon: PiggyBank, color: "#10b981" },
  credit_card: { label: "Credit Card", icon: CreditCard, color: "#f59e0b" },
  cash: { label: "Cash", icon: Banknote, color: "#8b5cf6" },
  investment: { label: "Investment", icon: TrendingUp, color: "#06b6d4" },
};

// ---------------------------------------------------------------------------
// Transaction types
// ---------------------------------------------------------------------------

export const TRANSACTION_TYPES = [
  { value: "income", label: "Income", color: "#10b981" },
  { value: "expense", label: "Expense", color: "#ef4444" },
  { value: "transfer", label: "Transfer", color: "#6366f1" },
] as const;

// ---------------------------------------------------------------------------
// Frequencies (for recurring transactions)
// ---------------------------------------------------------------------------

export const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

// ---------------------------------------------------------------------------
// Budget periods
// ---------------------------------------------------------------------------

export const BUDGET_PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

export const DEFAULT_CURRENCY = "USD";

export const CURRENCIES = [
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "\u20AC" },
  { value: "GBP", label: "British Pound", symbol: "\u00A3" },
  { value: "JPY", label: "Japanese Yen", symbol: "\u00A5" },
  { value: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$" },
] as const;

// ---------------------------------------------------------------------------
// Chart colors
// ---------------------------------------------------------------------------

export const COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#84cc16", // Lime
  "#a855f7", // Purple
  "#0ea5e9", // Sky
] as const;

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 20;
