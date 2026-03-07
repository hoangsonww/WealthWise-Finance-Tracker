"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AlertTriangle, CalendarIcon, Download, Palette, User } from "lucide-react";
import { updateProfileSchema, type UpdateProfileInput } from "@wealthwise/shared-types";
import { useAccounts } from "@/hooks/use-accounts";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { apiClient } from "@/lib/api-client";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { CURRENCIES } from "@/lib/constants";
import { toast } from "sonner";
import { AppearanceTab } from "@/components/settings/appearance-tab";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  useEffect(() => {
    if (!profile) {
      return;
    }

    form.reset({
      name: profile.name,
      currency: profile.currency,
    });
  }, [form, profile]);

  async function onSubmit(data: UpdateProfileInput) {
    await updateProfile.mutateAsync(data);
  }

  if (isLoading) {
    return (
      <Card className="rounded-[28px]">
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
      <Card className="rounded-[28px]">
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

  const totalBalance = accounts?.reduce((sum, account) => sum + account.balance, 0) ?? 0;

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-border/70">
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

      {accounts && accounts.length > 0 && (
        <Card className="rounded-[28px] border-border/70">
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

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your personal information and default currency.</CardDescription>
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
                onValueChange={(value) => form.setValue("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.symbol} {currency.label} ({currency.value})
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

function DataExportTab() {
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);

    try {
      const params = new URLSearchParams({ limit: "1000", page: "1" });
      if (startDate) {
        params.set("startDate", startDate);
      }
      if (endDate) {
        params.set("endDate", endDate);
      }

      const response = await apiClient.get<{ data: Record<string, unknown>[] }>(
        `/transactions?${params.toString()}`
      );
      const rows = response.data ?? [];

      let content: string;
      let mime: string;

      if (exportFormat === "json") {
        content = JSON.stringify(rows, null, 2);
        mime = "application/json";
      } else {
        if (rows.length === 0) {
          toast.error("No transactions to export");
          return;
        }

        const headers = Object.keys(rows[0]);
        const csvRows = [
          headers.join(","),
          ...rows.map((row) =>
            headers
              .map((header) => {
                const value = row[header] ?? "";
                const text = String(value).replace(/"/g, '""');
                return text.includes(",") || text.includes('"') || text.includes("\n")
                  ? `"${text}"`
                  : text;
              })
              .join(",")
          ),
        ];
        content = csvRows.join("\n");
        mime = "text/csv";
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `wealthwise-transactions-${format(new Date(), "yyyy-MM-dd")}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${rows.length} transactions`);
    } catch {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Card className="rounded-[28px] border-border/70">
      <CardHeader>
        <CardTitle>Data Export</CardTitle>
        <CardDescription>Export your transaction history for backup or analysis.</CardDescription>
      </CardHeader>
      <CardContent className="max-w-md space-y-4">
        <div className="space-y-2">
          <Label>Format</Label>
          <Select
            value={exportFormat}
            onValueChange={(value) => setExportFormat(value as "csv" | "json")}
          >
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
          <DateField
            label="Start Date (optional)"
            value={startDate}
            onChange={setStartDate}
            emptyLabel="From"
          />
          <DateField
            label="End Date (optional)"
            value={endDate}
            onChange={setEndDate}
            emptyLabel="To"
          />
        </div>

        <Button onClick={handleExport} disabled={isExporting} className="gap-2">
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export Transactions"}
        </Button>
      </CardContent>
    </Card>
  );
}

function DateField({
  label,
  value,
  onChange,
  emptyLabel,
}: {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  emptyLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start rounded-xl text-left text-sm font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {value ? format(new Date(value), "MMM d, yyyy") : emptyLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => onChange(date ? date.toISOString() : undefined)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DangerZoneTab() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE") {
      return;
    }

    setIsDeleting(true);

    try {
      await apiClient.delete("/auth/me");
      toast.success("Account deleted. Redirecting...");
      window.location.href = "/login";
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card className="rounded-[28px] border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that permanently affect your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
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
              transactions, budgets, categories, and goals will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </Label>
            <Input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
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

const VALID_TABS = ["profile", "appearance", "export", "danger"] as const;
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, interface preferences, exports, and account safety.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="h-4 w-4" />
            Appearance
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

        <TabsContent value="appearance">
          <AppearanceTab />
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
