"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  User,
  Tags,
  Download,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import {
  updateProfileSchema,
  createCategorySchema,
  updateCategorySchema,
} from "@wealthwise/shared-types";
import type {
  UpdateProfileInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryResponse,
} from "@wealthwise/shared-types";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-categories";
import { useAccounts } from "@/hooks/use-accounts";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { apiClient } from "@/lib/api-client";
import { cn, getInitials, formatCurrency, formatDate } from "@/lib/utils";
import { CURRENCIES } from "@/lib/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const CATEGORY_ICONS = [
  "🍔",
  "🏠",
  "🚗",
  "💊",
  "🎬",
  "📚",
  "👕",
  "💰",
  "✈️",
  "🎮",
  "🐕",
  "🎵",
  "⚡",
  "📱",
  "🎁",
  "💳",
  "🏋️",
  "🍕",
  "☕",
  "🛒",
  "💼",
  "🎓",
  "🏥",
  "🔧",
];

const CATEGORY_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryResponse | null;
}) {
  const isEdit = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(isEdit ? updateCategorySchema : createCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
      icon: category?.icon ?? "🍔",
      color: category?.color ?? "#6366f1",
      type: category?.type ?? "expense",
    },
  });

  const selectedIcon = form.watch("icon");
  const selectedColor = form.watch("color");

  async function onSubmit(data: CreateCategoryInput) {
    if (isEdit && category) {
      await updateCategory.mutateAsync({
        id: category.id,
        data: data as UpdateCategoryInput,
      });
    } else {
      await createCategory.mutateAsync(data);
    }
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Create Category"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your category details."
              : "Add a custom category for your transactions."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" placeholder="e.g. Groceries" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(v) => form.setValue("type", v as CreateCategoryInput["type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => form.setValue("icon", icon)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border-2 text-base transition-all hover:scale-105",
                    selectedIcon === icon
                      ? "border-primary bg-primary/10"
                      : "border-transparent bg-muted"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue("color", color)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-all hover:scale-110",
                    selectedColor === color ? "scale-110 border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
              {createCategory.isPending || updateCategory.isPending
                ? "Saving..."
                : isEdit
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProfileTab() {
  const { data: profile, isLoading, isError } = useProfile();
  const { data: accounts } = useAccounts();
  const updateProfile = useUpdateProfile();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
      currency: "USD",
    },
  });

  // Prefill form when profile loads
  const hasReset = useState(false);
  if (profile && !hasReset[0]) {
    form.reset({
      name: profile.name,
      currency: profile.currency,
    });
    hasReset[1](true);
  }

  async function onSubmit(data: UpdateProfileInput) {
    await updateProfile.mutateAsync(data);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load profile. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalBalance = accounts?.reduce((sum, a) => sum + a.balance, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback>{getInitials(profile?.name ?? "")}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{profile?.name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {profile?.createdAt && (
                <p className="text-xs text-muted-foreground">
                  Member since {formatDate(profile.createdAt, "MMMM yyyy")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account overview */}
      {accounts && accounts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold">{accounts.length}</p>
                <p className="text-xs text-muted-foreground">
                  {accounts.length === 1 ? "Account" : "Accounts"}
                </p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalBalance, profile?.currency)}
                </p>
                <p className="text-xs text-muted-foreground">Total Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit profile form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your personal information and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Your name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input disabled value={profile?.email ?? ""} className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>

            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select
                value={form.watch("currency") ?? "USD"}
                onValueChange={(v) => form.setValue("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.symbol} {c.label} ({c.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.currency && (
                <p className="text-sm text-destructive">{form.formState.errors.currency.message}</p>
              )}
            </div>

            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriesTab() {
  const { data: categories } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const incomeCategories = categories?.filter((c) => c.type === "income") ?? [];
  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? [];

  function handleDelete() {
    if (deleteId) {
      deleteCategory.mutate(deleteId);
      setDeleteId(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage your transaction categories.</CardDescription>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setEditCategory(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Expense Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Expense Categories
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {cat.icon}
                    </div>
                    <span className="text-sm font-medium">{cat.name}</span>
                    {cat.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {!cat.isDefault && (
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditCategory(cat);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteId(cat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Income Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Income Categories
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {incomeCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {cat.icon}
                    </div>
                    <span className="text-sm font-medium">{cat.name}</span>
                    {cat.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {!cat.isDefault && (
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditCategory(cat);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteId(cat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <CategoryFormDialog
        key={editCategory?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditCategory(null);
        }}
        category={editCategory}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? Transactions using this category will need to be recategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DataExportTab() {
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ limit: "1000", page: "1" });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      // Fetch all transactions (up to 1000) from the real endpoint
      const res = await apiClient.get<{ data: Record<string, unknown>[] }>(
        `/transactions?${params.toString()}`
      );
      const rows = res.data ?? [];

      let content: string;
      let mime: string;

      if (exportFormat === "json") {
        content = JSON.stringify(rows, null, 2);
        mime = "application/json";
      } else {
        // Build CSV header from first row keys
        if (rows.length === 0) {
          toast.error("No transactions to export");
          return;
        }
        const headers = Object.keys(rows[0]);
        const csvRows = [
          headers.join(","),
          ...rows.map((row) =>
            headers
              .map((h) => {
                const val = row[h] ?? "";
                const str = String(val).replace(/"/g, '""');
                return str.includes(",") || str.includes('"') || str.includes("\n")
                  ? `"${str}"`
                  : str;
              })
              .join(",")
          ),
        ];
        content = csvRows.join("\n");
        mime = "text/csv";
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wealthwise-transactions-${format(new Date(), "yyyy-MM-dd")}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} transactions`);
    } catch {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Export</CardTitle>
        <CardDescription>Export your transaction data for backup or analysis.</CardDescription>
      </CardHeader>
      <CardContent className="max-w-md space-y-4">
        <div className="space-y-2">
          <Label>Format</Label>
          <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "csv" | "json")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Start Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left text-sm font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {startDate ? format(new Date(startDate), "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate ? new Date(startDate) : undefined}
                  onSelect={(date) => setStartDate(date ? date.toISOString() : undefined)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>End Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left text-sm font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {endDate ? format(new Date(endDate), "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate ? new Date(endDate) : undefined}
                  onSelect={(date) => setEndDate(date ? date.toISOString() : undefined)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button onClick={handleExport} disabled={isExporting} className="gap-2">
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export Transactions"}
        </Button>
      </CardContent>
    </Card>
  );
}

function DangerZoneTab() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      await apiClient.delete("/auth/me");
      toast.success("Account deleted. Redirecting...");
      window.location.href = "/login";
    } catch (err) {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-semibold">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data including accounts,
              transactions, budgets, and goals will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== "DELETE" || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const VALID_TABS = ["profile", "categories", "export", "danger"] as const;
type SettingsTab = (typeof VALID_TABS)[number];

export function SettingsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: SettingsTab = VALID_TABS.includes(tabParam as SettingsTab)
    ? (tabParam as SettingsTab)
    : "profile";

  function onTabChange(value: string) {
    router.push(`/settings?tab=${value}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and configuration.</p>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <Tags className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5">
            <Download className="h-4 w-4" />
            Data Export
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>

        <TabsContent value="export">
          <DataExportTab />
        </TabsContent>

        <TabsContent value="danger">
          <DangerZoneTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
