"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaves } from "@/hooks/use-leaves";
import api from "@/lib/axios";
import { posthog } from "@/lib/posthog";
import { formatLeaveType } from "@/lib/utils";

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<Record<string, string>>({});

  const { data, isLoading } = useLeaves({
    status: "PENDING",
    page: 1,
    limit: 50,
  });

  const mutation = useMutation({
    mutationFn: async ({
      leaveId,
      status,
      comment,
    }: {
      leaveId: string;
      status: "APPROVED" | "REJECTED";
      comment?: string;
    }) => {
      await api.patch(`/leave/${leaveId}/status`, { status, comment });
    },
    onSuccess: async (_data, variables) => {
      if (variables.status === "APPROVED") {
        posthog.capture("leave_approved");
      }
      toast.success("Request updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaves"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
    },
    onError: () => {
      toast.error("Could not update request");
    },
  });

  return (
    <RoleGuard
      allowedRoles={["MANAGER", "ADMIN"]}
      fallback={
        <PageContainer>
          <p className="text-sm text-muted-foreground">Access denied.</p>
        </PageContainer>
      }
    >
      <PageContainer className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and action pending leave requests.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton
                    key={`approval-skel-${i + 1}`}
                    className="h-14 w-full"
                  />
                ))}
              </div>
            ) : !(data?.leaves.length ?? 0) ? (
              <p className="text-sm text-muted-foreground">
                No pending approvals.
              </p>
            ) : (
              <div className="space-y-3">
                {data?.leaves.map((leave) => {
                  const comment = comments[leave.id] ?? "";
                  const busy =
                    mutation.isPending &&
                    mutation.variables?.leaveId === leave.id;

                  return (
                    <div key={leave.id} className="rounded-lg border p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            {leave.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(leave.startDate), "MMM d, yyyy")} →{" "}
                            {format(parseISO(leave.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {formatLeaveType(leave.type)}
                          </Badge>
                          <Badge>{leave.status}</Badge>
                        </div>
                      </div>

                      <Input
                        placeholder="Optional comment"
                        value={comment}
                        onChange={(e) =>
                          setComments((prev) => ({
                            ...prev,
                            [leave.id]: e.target.value,
                          }))
                        }
                      />

                      {leave.capacityWarning && (
                        <div className="mt-2 rounded-md border border-amber-300/70 bg-amber-50/70 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                          <p className="flex items-start gap-1.5">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{leave.capacityWarning.message}</span>
                          </p>
                        </div>
                      )}

                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            mutation.mutate({
                              leaveId: leave.id,
                              status: "APPROVED",
                              comment: comment || undefined,
                            })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() =>
                            mutation.mutate({
                              leaveId: leave.id,
                              status: "REJECTED",
                              comment: comment || undefined,
                            })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </RoleGuard>
  );
}
