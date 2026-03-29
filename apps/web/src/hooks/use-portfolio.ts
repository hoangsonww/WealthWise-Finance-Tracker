"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
  HoldingResponse,
  CreateHoldingInput,
  UpdateHoldingInput,
  RefreshPricesInput,
  PortfolioSummary,
  ApiResponse,
} from "@wealthwise/shared-types";

export const holdingKeys = {
  all: ["holdings"] as const,
  lists: () => [...holdingKeys.all, "list"] as const,
  details: () => [...holdingKeys.all, "detail"] as const,
  detail: (id: string) => [...holdingKeys.details(), id] as const,
  summary: () => [...holdingKeys.all, "summary"] as const,
};

export function useHoldings() {
  return useQuery({
    queryKey: holdingKeys.lists(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<HoldingResponse[]>>("/holdings");
      return res.data;
    },
  });
}

export function useHolding(id: string) {
  return useQuery({
    queryKey: holdingKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<HoldingResponse>>(`/holdings/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: holdingKeys.summary(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PortfolioSummary>>("/holdings/summary");
      return res.data;
    },
  });
}

export function useCreateHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHoldingInput) => {
      const res = await apiClient.post<ApiResponse<HoldingResponse>>("/holdings", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holdingKeys.all });
      toast.success("Holding added successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to add holding", {
        description: error.message,
      });
    },
  });
}

export function useUpdateHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHoldingInput }) => {
      const res = await apiClient.patch<ApiResponse<HoldingResponse>>(`/holdings/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: holdingKeys.all });
      queryClient.invalidateQueries({ queryKey: holdingKeys.detail(variables.id) });
      toast.success("Holding updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update holding", {
        description: error.message,
      });
    },
  });
}

export function useDeleteHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<ApiResponse<null>>(`/holdings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holdingKeys.all });
      toast.success("Holding removed successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove holding", {
        description: error.message,
      });
    },
  });
}

export function useRefreshPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RefreshPricesInput) => {
      const res = await apiClient.post<ApiResponse<HoldingResponse[]>>(
        "/holdings/refresh-prices",
        data
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: holdingKeys.all });
      toast.success(`${data?.length ?? 0} holding(s) price updated`);
    },
    onError: (error: Error) => {
      toast.error("Failed to refresh prices", {
        description: error.message,
      });
    },
  });
}
