"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, differenceInDays } from "date-fns";
import {
  Plus,
  Repeat,
  MoreHorizontal,
  Pencil,
  Trash2,
  Pause,
  Play,
  CreditCard,
  CalendarIcon,
  Clock,
  Search,
} from "lucide-react";
import { createRecurringSchema, updateRecurringSchema } from "@wealthwise/shared-types";
import type {
  CreateRecurringInput,
  UpdateRecurringInput,
  RecurringResponse,
} from "@wealthwise/shared-types";
import {
  useRecurringRules,
  useUpcomingBills,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
  useMarkAsPaid,
} from "@/hooks/use-recurring";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { formatCurrency, cn } from "@/lib/utils";
import { FREQUENCIES } from "@/lib/constants";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function RecurringFormDialog({
  open,
  onOpenChange,
  recurring,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurring?: RecurringResponse | null;
}) {
  const isEdit = !!recurring;
  const createRecurring = useCreateRecurring();
  const updateRecurring = useUpdateRecurring();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const form = useForm<CreateRecurringInput>({
    resolver: zodResolver(isEdit ? updateRecurringSchema : createRecurringSchema),
    defaultValues: {
      type: recurring?.type ?? "expense",
      amount: recurring?.amount ?? 0,
      description: recurring?.description ?? "",
      accountId: recurring?.accountId ?? "",
      categoryId: recurring?.categoryId ?? "",
      frequency: recurring?.frequency ?? "monthly",
      startDate: recurring?.startDate ?? new Date().toISOString(),
      endDate: recurring?.endDate ?? undefined,
    },
  });

  const selectedType = form.watch("type");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const filteredCategories = categories?.filter((c) => c.type === selectedType);

  async function onSubmit(data: CreateRecurringInput) {
    if (isEdit && recurring) {
      await updateRecurring.mutateAsync({
        id: recurring.id,
        data: data as UpdateRecurringInput,
      });
    } else {
      await createRecurring.mutateAsync(data);
    }
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Recurring Rule" : "Add Recurring Rule"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the recurring transaction settings."
              : "Set up a recurring income or expense."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs
            value={selectedType}
            onValueChange={(value) => form.setValue("type", value as CreateRecurringInput["type"])}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="income"
                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                Income
              </TabsTrigger>
              <TabsTrigger
                value="expense"
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                Expense
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="r-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="r-amount"
                type="number"
                step="0.01"
                min="0"
                className="pl-7"
                {...form.register("amount", { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-desc">Description</Label>
            <Input
              id="r-desc"
              placeholder="e.g. Netflix subscription"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Account</Label>
            <Select
              value={form.watch("accountId")}
              onValueChange={(v) => form.setValue("accountId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.watch("categoryId")}
              onValueChange={(v) => form.setValue("categoryId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span>{c.icon}</span>
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={form.watch("frequency")}
              onValueChange={(v) =>
                form.setValue("frequency", v as CreateRecurringInput["frequency"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
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
                    {startDate ? format(new Date(startDate), "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date) => {
                      if (date) form.setValue("startDate", date.toISOString());
                    }}
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
                    {endDate ? format(new Date(endDate), "MMM d, yyyy") : "No end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate ? new Date(endDate) : undefined}
                    onSelect={(date) => {
                      form.setValue("endDate", date ? date.toISOString() : undefined);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRecurring.isPending || updateRecurring.isPending}>
              {createRecurring.isPending || updateRecurring.isPending
                ? "Saving..."
                : isEdit
                  ? "Update"
                  : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecurringPageClient() {
  const [formOpen, setFormOpen] = useState(false);
  const [editRecurring, setEditRecurring] = useState<RecurringResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rules, isLoading: rulesLoading } = useRecurringRules();
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingBills();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const deleteRecurring = useDeleteRecurring();
  const updateRecurring = useUpdateRecurring();
  const markAsPaid = useMarkAsPaid();

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string }>();
    categories?.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const filteredRules = useMemo(() => {
    if (!rules || !searchQuery.trim()) return rules;
    const q = searchQuery.toLowerCase();
    return rules.filter((rule) => {
      const cat = categoryMap.get(rule.categoryId);
      const account = accountMap.get(rule.accountId);
      return (
        rule.description.toLowerCase().includes(q) ||
        rule.frequency.toLowerCase().includes(q) ||
        (cat?.name.toLowerCase().includes(q) ?? false) ||
        (account?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rules, searchQuery, categoryMap, accountMap]);

  function handleEdit(rule: RecurringResponse) {
    setEditRecurring(rule);
    setFormOpen(true);
  }

  function handleTogglePause(rule: RecurringResponse) {
    updateRecurring.mutate({
      id: rule.id,
      data: { description: rule.description },
    });
  }

  function handleDelete() {
    if (deleteId) {
      deleteRecurring.mutate(deleteId);
      setDeleteId(null);
    }
  }

  const isLoading = rulesLoading || upcomingLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring</h1>
          <p className="text-muted-foreground">Manage recurring transactions and upcoming bills.</p>
        </div>
        <Button
          onClick={() => {
            setEditRecurring(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Recurring
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="mb-3 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24" />
              </Card>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      ) : (!rules || rules.length === 0) && (!upcoming || upcoming.length === 0) ? (
        <Card className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Repeat className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No recurring transactions</h3>
            <p className="mt-1 max-w-sm text-muted-foreground">
              Set up recurring rules for bills, subscriptions, and regular income.
            </p>
            <Button
              className="mt-4 gap-2"
              onClick={() => {
                setEditRecurring(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Your First Rule
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Upcoming Bills */}
          {upcoming && upcoming.length > 0 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Upcoming
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((bill) => {
                  const cat = categoryMap.get(bill.categoryId);
                  const daysUntil = differenceInDays(new Date(bill.nextDueDate), new Date());
                  return (
                    <Card key={bill.id} className="transition-shadow hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                              style={{
                                backgroundColor: cat ? `${cat.color}20` : "#6366f120",
                              }}
                            >
                              {cat?.icon ?? "📋"}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{bill.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(bill.nextDueDate), "MMM d, yyyy")}
                                {daysUntil >= 0 && (
                                  <span
                                    className={cn(
                                      "ml-1 font-medium",
                                      daysUntil <= 3
                                        ? "text-red-600 dark:text-red-400"
                                        : daysUntil <= 7
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-foreground"
                                    )}
                                  >
                                    ({daysUntil === 0 ? "Today" : `${daysUntil}d`})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "text-sm font-bold",
                                bill.type === "income"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {bill.type === "income" ? "+" : "-"}
                              {formatCurrency(bill.amount)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full gap-1.5 text-xs"
                          onClick={() => markAsPaid.mutate(bill.id)}
                          disabled={markAsPaid.isPending}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Record Payment
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Rules Table */}
          {rules && rules.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Repeat className="h-5 w-5 text-muted-foreground" />
                  All Rules
                </h2>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Account</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead className="hidden sm:table-cell">Next Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRules && filteredRules.length > 0 ? (
                      filteredRules.map((rule) => {
                        const cat = categoryMap.get(rule.categoryId);
                        return (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.description}</TableCell>
                            <TableCell className="text-sm capitalize">{rule.frequency}</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  rule.type === "income"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400"
                                )}
                              >
                                {rule.type === "income" ? "+" : "-"}
                                {formatCurrency(rule.amount)}
                              </span>
                            </TableCell>
                            <TableCell className="hidden text-sm md:table-cell">
                              {accountMap.get(rule.accountId) ?? "--"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {cat ? (
                                <span className="flex items-center gap-1.5 text-sm">
                                  <span>{cat.icon}</span>
                                  {cat.name}
                                </span>
                              ) : (
                                "--"
                              )}
                            </TableCell>
                            <TableCell className="hidden text-sm sm:table-cell">
                              {format(new Date(rule.nextDueDate), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={rule.isActive ? "default" : "secondary"}
                                className={cn(
                                  "text-xs",
                                  rule.isActive &&
                                    "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
                                )}
                              >
                                {rule.isActive ? "Active" : "Paused"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(rule)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTogglePause(rule)}>
                                    {rule.isActive ? (
                                      <>
                                        <Pause className="mr-2 h-4 w-4" />
                                        Pause
                                      </>
                                    ) : (
                                      <>
                                        <Play className="mr-2 h-4 w-4" />
                                        Resume
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => markAsPaid.mutate(rule.id)}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Record Payment
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeleteId(rule.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          No rules match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Dialog */}
      <RecurringFormDialog
        key={editRecurring?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditRecurring(null);
        }}
        recurring={editRecurring}
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
            <AlertDialogTitle>Delete Recurring Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recurring rule? Future occurrences will not be
              created. Existing transactions will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRecurring.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
