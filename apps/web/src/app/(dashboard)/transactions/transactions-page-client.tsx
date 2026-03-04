"use client";

import { useState } from "react";
import {
  Plus,
  Upload,
  Search,
  SlidersHorizontal,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { TransactionQuery, TransactionResponse } from "@wealthwise/shared-types";
import {
  useTransactions,
  useDeleteTransaction,
  useCreateTransaction,
} from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { CsvImportWizard } from "@/components/transactions/csv-import-wizard";
import { FilterSidebar } from "@/components/transactions/filter-sidebar";

export function TransactionsPageClient() {
  const [filters, setFilters] = useState<Partial<TransactionQuery>>({
    page: 1,
    limit: 20,
    sortBy: "date",
    sortOrder: "desc",
  });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<TransactionResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeFilters = {
    ...filters,
    search: search || undefined,
  };

  const { data: transactionsData, isLoading } = useTransactions(activeFilters);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const deleteTransaction = useDeleteTransaction();
  const createTransaction = useCreateTransaction();

  const transactions = transactionsData?.data ?? [];
  const pagination = transactionsData?.pagination;

  function handleEdit(transaction: TransactionResponse) {
    setEditTransaction(transaction);
    setFormOpen(true);
  }

  function handleDelete() {
    if (deleteId) {
      deleteTransaction.mutate(deleteId);
      setDeleteId(null);
    }
  }

  function handleDuplicate(transaction: TransactionResponse) {
    createTransaction.mutate({
      type: transaction.type,
      amount: transaction.amount,
      description: `${transaction.description} (copy)`,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      date: new Date().toISOString(),
      notes: transaction.notes ?? undefined,
      tags: transaction.tags,
      isRecurring: false,
    });
  }

  function handlePageChange(newPage: number) {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View and manage all your financial transactions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button
            onClick={() => {
              setEditTransaction(null);
              setFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFilters((prev) => ({ ...prev, page: 1 }));
            }}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterSidebar
                filters={filters}
                onFiltersChange={(f) => setFilters({ ...f, page: 1 })}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Content Layout */}
      <div className="flex gap-6">
        {/* Desktop Filter Sidebar */}
        <div className="hidden w-[260px] shrink-0 lg:block">
          <Card className="sticky top-6 p-4">
            <FilterSidebar
              filters={filters}
              onFiltersChange={(f) => setFilters({ ...f, page: 1 })}
            />
          </Card>
        </div>

        {/* Main Content */}
        <div className="min-w-0 flex-1 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 &&
            !search &&
            !filters.accountId &&
            !filters.categoryId &&
            !filters.type ? (
            <Card className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No transactions yet</h3>
                <p className="mt-1 max-w-sm text-muted-foreground">
                  Add your first transaction or import from a CSV file.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </Button>
                  <Button
                    onClick={() => {
                      setEditTransaction(null);
                      setFormOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Transaction
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <TransactionTable
                data={transactions}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteId(id)}
                onDuplicate={handleDuplicate}
                categories={categories}
                accounts={accounts}
              />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="px-2 text-sm font-medium">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Transaction Form Dialog */}
      <TransactionForm
        key={editTransaction?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditTransaction(null);
        }}
        transaction={editTransaction}
      />

      {/* CSV Import Wizard */}
      <CsvImportWizard open={importOpen} onOpenChange={setImportOpen} />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTransaction.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
