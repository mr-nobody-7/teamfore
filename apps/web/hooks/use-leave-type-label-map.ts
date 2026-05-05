"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, LeaveTypeSettingsResponse } from "@/types/api";

/**
 * Returns a map of leave type key → human-readable label.
 * Uses the same React Query cache as the settings page so no extra requests
 * are made when the cache is warm.
 */
export function useLeaveTypeLabelMap(): Record<string, string> {
  const { data } = useQuery({
    queryKey: ["leave-type-settings"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<LeaveTypeSettingsResponse>>(
        "/settings/leave-types",
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min — labels rarely change mid-session
  });

  if (!data?.leaveTypes) return {};

  return Object.fromEntries(data.leaveTypes.map((lt) => [lt.type, lt.label]));
}
