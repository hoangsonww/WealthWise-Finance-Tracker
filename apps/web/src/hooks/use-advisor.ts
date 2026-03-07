"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { accountKeys } from "./use-accounts";
import { budgetKeys } from "./use-budgets";
import { categoryKeys } from "./use-categories";
import { goalKeys } from "./use-goals";
import { recurringKeys } from "./use-recurring";
import { transactionKeys } from "./use-transactions";
import type {
  AdvisorActionExecutionResult,
  AdvisorActionProposal,
  AdvisorChatRequest,
  AdvisorChatResponse,
  ApiResponse,
} from "@wealthwise/shared-types";

export function useAdvisorChat() {
  return useMutation({
    mutationFn: async (data: AdvisorChatRequest) => {
      const response = await apiClient.post<ApiResponse<AdvisorChatResponse>>(
        "/advisor/chat",
        data
      );
      return response.data;
    },
    onError: (error: Error) => {
      toast.error("AI advisor is unavailable", {
        description: error.message,
      });
    },
  });
}

export function useExecuteAdvisorAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: AdvisorActionProposal) => {
      const response = await apiClient.post<ApiResponse<AdvisorActionExecutionResult>>(
        "/advisor/actions/execute",
        { action }
      );
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });

      toast.success("Action completed", {
        description: result.summary,
      });
    },
    onError: (error: Error) => {
      toast.error("Action could not be completed", {
        description: error.message,
      });
    },
  });
}
