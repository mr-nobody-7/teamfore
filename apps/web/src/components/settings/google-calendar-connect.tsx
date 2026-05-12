"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

type CalendarStatus = {
  connected: boolean;
};

function resolveApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");
}

export function GoogleCalendarConnectCard() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-status"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<CalendarStatus>>(
        "/auth/calendar-status",
      );
      return response.data.data;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/google/calendar-disconnect");
    },
    onSuccess: async () => {
      toast.success("Google Calendar disconnected");
      await queryClient.invalidateQueries({ queryKey: ["calendar-status"] });
    },
    onError: () => {
      toast.error("Could not disconnect Google Calendar");
    },
  });

  const handleConnect = () => {
    const apiBaseUrl = resolveApiBaseUrl();
    window.location.href = `${apiBaseUrl}/auth/google/calendar-connect`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading status...</p>
        ) : data?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div className="text-sm">Calendar sync is enabled.</div>
              <Badge className="bg-emerald-600 text-white">Connected</Badge>
            </div>
            <Button
              variant="destructive"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar to enable leave sync features.
            </p>
            <Button onClick={handleConnect}>Connect Google Calendar</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
