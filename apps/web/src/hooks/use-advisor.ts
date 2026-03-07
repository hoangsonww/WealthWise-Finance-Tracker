"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
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
