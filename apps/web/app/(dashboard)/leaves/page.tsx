"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useLeaves } from "@/hooks/use-leaves";
import { useRole } from "@/hooks/use-role";
import api from "@/lib/axios";
import { formatLeaveType } from "@/lib/utils";
import type { LeaveStatus } from "@/types/api";

const STATUS_OPTIONS: Array<"ALL" | LeaveStatus> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

export default function LeavesPage() {
  const queryClient = useQueryClient();
  const { role } = useRole();
  const { user } = useAuth();
  const [status, setStatus] = useState<"ALL" | LeaveStatus>("ALL");

  const { data, isLoading } = useLeaves(
    {
      ...(status !== "ALL" ? { status } : {}),
      page: 1,
      limit: 20,
    },
    true,
  );

  const cancelMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      await api.patch(`/leave/${leaveId}/cancel`);
    },
    onSuccess: async () => {
      toast.success("Leave cancelled");
      await queryClient.invalidateQueries({ queryKey: ["leaves"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: () => {
      toast.error("Could not cancel leave");
    },
  });

  return (
    <PageContainer className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {role === "USER"
              ? "My Leaves"
              : role === "MANAGER"
                ? "Team Leaves"
                : "All Leaves"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track request status and leave history.
          </p>
        </div>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as "ALL" | LeaveStatus)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((item) => (
              <SelectItem key={item} value={item}>
                {item === "ALL" ? "All Status" : item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={`leave-skel-${i + 1}`} className="h-12 w-full" />
              ))}
            </div>
          ) : !(data?.leaves.length ?? 0) ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                No leave requests yet.
              </p>
              <Button asChild size="sm">
                <Link href="/leaves/apply">Apply for leave</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.leaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{leave.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(leave.startDate), "MMM d, yyyy")} →{" "}
                      {format(parseISO(leave.endDate), "MMM d, yyyy")}
                    </p>
                    {leave.comment && (
                      <p className="text-xs text-muted-foreground">
                        Comment: {leave.comment}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {formatLeaveType(leave.type)}
                    </Badge>
                    <Badge>{leave.status}</Badge>
                    {leave.status === "PENDING" &&
                      leave.userId === user?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelMutation.mutate(leave.id)}
                          disabled={cancelMutation.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
