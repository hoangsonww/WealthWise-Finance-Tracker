"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
  CategoryManagementResponse,
  CreateCategoryInput,
  UpdateCategoryInput,
  ApiResponse,
} from "@wealthwise/shared-types";

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CategoryManagementResponse[]>>("/categories");
      return res.data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const res = await apiClient.post<ApiResponse<CategoryManagementResponse>>(
        "/categories",
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Category created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create category", {
        description: error.message,
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryInput }) => {
      const res = await apiClient.patch<ApiResponse<CategoryManagementResponse>>(
        `/categories/${id}`,
        data
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(variables.id),
      });
      toast.success("Category updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update category", {
        description: error.message,
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<ApiResponse<CategoryManagementResponse>>(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Category deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete category", {
        description: error.message,
      });
    },
  });
}
