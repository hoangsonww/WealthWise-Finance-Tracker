"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, MoreHorizontal, Pencil, Archive, Trash2, Wallet } from "lucide-react";
import { createAccountSchema, updateAccountSchema } from "@wealthwise/shared-types";
import type {
  CreateAccountInput,
  UpdateAccountInput,
  AccountResponse,
} from "@wealthwise/shared-types";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "@/hooks/use-accounts";
import { formatCurrency, cn } from "@/lib/utils";
import { ACCOUNT_TYPES, COLORS } from "@/lib/constants";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const PRESET_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

function AccountFormDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountResponse | null;
}) {
  const isEdit = !!account;
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(isEdit ? updateAccountSchema : createAccountSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "checking",
      balance: account?.balance ?? 0,
      currency: account?.currency ?? "USD",
      color: account?.color ?? "#6366f1",
    },
  });

  const selectedColor = form.watch("color");

  async function onSubmit(data: CreateAccountInput) {
    if (isEdit && account) {
      await updateAccount.mutateAsync({
        id: account.id,
        data: data as UpdateAccountInput,
      });
    } else {
      await createAccount.mutateAsync(data);
    }
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Account" : "Add New Account"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your account details below."
              : "Create a new financial account to track your money."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input id="name" placeholder="e.g. Main Checking" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Account Type</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as CreateAccountInput["type"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPES).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <config.icon className="h-4 w-4" />
                      {config.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">{isEdit ? "Balance" : "Initial Balance"}</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register("balance", { valueAsNumber: true })}
            />
            {form.formState.errors.balance && (
              <p className="text-sm text-destructive">{form.formState.errors.balance.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={form.watch("currency")}
              onValueChange={(value) => form.setValue("currency", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue("color", color)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
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
            <Button type="submit" disabled={createAccount.isPending || updateAccount.isPending}>
              {createAccount.isPending || updateAccount.isPending
                ? "Saving..."
                : isEdit
                  ? "Update Account"
                  : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AccountCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute bottom-0 left-0 top-0 w-1 bg-muted" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="mt-1 h-4 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-4 w-16" />
      </CardContent>
    </Card>
  );
}

export function AccountsPageClient() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<AccountResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: accounts, isLoading } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const updateAccount = useUpdateAccount();

  const totalBalance =
    accounts?.filter((a) => !a.isArchived).reduce((sum, a) => sum + a.balance, 0) ?? 0;

  const activeAccounts = accounts?.filter((a) => !a.isArchived) ?? [];

  function handleEdit(account: AccountResponse) {
    setEditAccount(account);
    setDialogOpen(true);
  }

  function handleArchive(account: AccountResponse) {
    updateAccount.mutate({
      id: account.id,
      data: { name: account.name },
    });
  }

  function handleDelete() {
    if (deleteId) {
      deleteAccount.mutate(deleteId);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your financial accounts and track balances.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditAccount(null);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Total Balance */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardHeader className="pb-2">
          <CardDescription className="text-sm font-medium">Total Balance</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <p className="text-4xl font-bold tracking-tight">{formatCurrency(totalBalance)}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            Across {activeAccounts.length} active account
            {activeAccounts.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AccountCardSkeleton key={i} />
          ))}
        </div>
      ) : activeAccounts.length === 0 ? (
        <Card className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No accounts yet</h3>
            <p className="mt-1 max-w-sm text-muted-foreground">
              Add your first financial account to start tracking your money.
            </p>
            <Button
              className="mt-4 gap-2"
              onClick={() => {
                setEditAccount(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Your First Account
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeAccounts.map((account) => {
            const typeConfig = ACCOUNT_TYPES[account.type];
            const Icon = typeConfig?.icon ?? Wallet;
            return (
              <Card
                key={account.id}
                className="group relative overflow-hidden transition-shadow hover:shadow-md"
              >
                <div
                  className="absolute bottom-0 left-0 top-0 w-1"
                  style={{ backgroundColor: account.color }}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="rounded-lg p-1.5"
                        style={{
                          backgroundColor: `${account.color}20`,
                        }}
                      >
                        <Icon className="h-4 w-4" style={{ color: account.color }} />
                      </div>
                      <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(account)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(account)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(account.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="mb-3 text-xs">
                    {typeConfig?.label ?? account.type}
                  </Badge>
                  <p
                    className={cn(
                      "text-2xl font-bold tracking-tight",
                      account.balance < 0 ? "text-destructive" : "text-foreground"
                    )}
                  >
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{account.currency}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <AccountFormDialog
        key={editAccount?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditAccount(null);
        }}
        account={editAccount}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This action cannot be undone. All
              associated transactions will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAccount.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
