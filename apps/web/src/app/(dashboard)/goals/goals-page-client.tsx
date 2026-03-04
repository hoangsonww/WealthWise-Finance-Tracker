"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Target, ChevronDown, ChevronRight } from "lucide-react";
import { addFundsSchema } from "@wealthwise/shared-types";
import type { AddFundsInput, GoalResponse } from "@wealthwise/shared-types";
import { useGoals, useDeleteGoal, useAddFunds } from "@/hooks/use-goals";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalForm } from "@/components/goals/goal-form";

function AddFundsDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: GoalResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addFunds = useAddFunds();
  const form = useForm<AddFundsInput>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: { amount: 0 },
  });

  const remaining = goal ? Math.max(goal.targetAmount - goal.currentAmount, 0) : 0;

  async function onSubmit(data: AddFundsInput) {
    if (goal) {
      await addFunds.mutateAsync({ id: goal.id, data });
      form.reset();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{goal?.icon}</span>
            Add Funds to {goal?.name}
          </DialogTitle>
          <DialogDescription>
            {remaining > 0
              ? `${formatCurrency(remaining)} remaining to reach your goal.`
              : "Your goal is already complete!"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fund-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="fund-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7 text-lg"
                {...form.register("amount", { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addFunds.isPending}>
              {addFunds.isPending ? "Adding..." : "Add Funds"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GoalsPageClient() {
  const [formOpen, setFormOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<GoalResponse | null>(null);
  const [addFundsGoal, setAddFundsGoal] = useState<GoalResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: goals, isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();

  const activeGoals = useMemo(() => goals?.filter((g) => !g.isCompleted) ?? [], [goals]);
  const completedGoals = useMemo(() => goals?.filter((g) => g.isCompleted) ?? [], [goals]);

  function handleEdit(goal: GoalResponse) {
    setEditGoal(goal);
    setFormOpen(true);
  }

  function handleDelete() {
    if (deleteId) {
      deleteGoal.mutate(deleteId);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">
            Track your savings goals and watch your progress grow.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditGoal(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Active Goals */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="mb-2 h-5 w-36" />
              <Skeleton className="mb-3 h-2.5 w-full rounded-full" />
              <Skeleton className="mb-4 h-3 w-24" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
        <Card className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No goals yet</h3>
            <p className="mt-1 max-w-sm text-muted-foreground">
              Set your first savings goal and start tracking your progress.
            </p>
            <Button
              className="mt-4 gap-2"
              onClick={() => {
                setEditGoal(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create Your First Goal
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteId(id)}
                  onAddFunds={(g) => setAddFundsGoal(g)}
                />
              ))}
            </div>
          )}

          {/* Completed Goals Section */}
          {completedGoals.length > 0 && (
            <div className="space-y-4">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {showCompleted ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Completed Goals ({completedGoals.length})
              </button>

              {showCompleted && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={handleEdit}
                      onDelete={(id) => setDeleteId(id)}
                      onAddFunds={(g) => setAddFundsGoal(g)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Goal Form Dialog */}
      <GoalForm
        key={editGoal?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditGoal(null);
        }}
        goal={editGoal}
      />

      {/* Add Funds Dialog */}
      <AddFundsDialog
        goal={addFundsGoal}
        open={!!addFundsGoal}
        onOpenChange={(open) => {
          if (!open) setAddFundsGoal(null);
        }}
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
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGoal.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
