"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { AlertTriangle, MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { useLeaves } from "@/hooks/use-leaves";
import api from "@/lib/axios";
import { posthog } from "@/lib/posthog";
import { formatLeaveType } from "@/lib/utils";
import type { LeaveRequest } from "@/types/api";

function hasCapacityConflict(leave: LeaveRequest): boolean {
  const leaveWithFlags = leave as LeaveRequest & {
    shouldWarn?: boolean;
    capacityWarning?: LeaveRequest["capacityWarning"] | boolean;
  };

  if (leaveWithFlags.shouldWarn === true) {
    return true;
  }

  if (typeof leaveWithFlags.capacityWarning === "boolean") {
    return leaveWithFlags.capacityWarning;
  }

  return leaveWithFlags.capacityWarning?.shouldWarn === true;
}

function getLeaveDurationDays(leave: LeaveRequest) {
  const start = parseISO(leave.startDate);
  const end = parseISO(leave.endDate);
  let days = differenceInCalendarDays(end, start) + 1;

  if (leave.startSession !== "FULL_DAY") {
    days -= 0.5;
  }
  if (leave.endSession !== "FULL_DAY") {
    days -= 0.5;
  }

  return Math.max(days, 0.5);
}

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const { data, isLoading } = useLeaves({
    status: "PENDING",
    page: 1,
    limit: 50,
  });
  const { data: dashboardSummary } = useDashboardSummary();

  const updateLeaveStatus = async ({
    leaveId,
    status,
    comment,
  }: {
    leaveId: string;
    status: "APPROVED" | "REJECTED";
    comment?: string;
  }) => {
    await api.patch(`/leave/${leaveId}/status`, { status, comment });
  };

  const pendingLeaves = data?.leaves ?? [];
  const safePendingLeaves = useMemo(
    () => pendingLeaves.filter((leave) => !hasCapacityConflict(leave)),
    [pendingLeaves],
  );
  const riskyCount = pendingLeaves.length - safePendingLeaves.length;
  const pendingDays = useMemo(
    () =>
      pendingLeaves.reduce(
        (acc, leave) => acc + getLeaveDurationDays(leave),
        0,
      ),
    [pendingLeaves],
  );
  const canBulkApprove = safePendingLeaves.length > 0 && !isBulkApproving;

  const handleApproveAllSafe = async () => {
    if (safePendingLeaves.length === 0 || isBulkApproving) {
      return;
    }

    setIsBulkApproving(true);
    try {
      const results = await Promise.allSettled(
        safePendingLeaves.map((leave) =>
          updateLeaveStatus({
            leaveId: leave.id,
            status: "APPROVED",
          }),
        ),
      );
      const successCount = results.filter(
        (result) => result.status === "fulfilled",
      ).length;

      if (successCount > 0) {
        posthog.capture("leave_approved", {
          source: "bulk_safe",
          count: successCount,
        });
      }

      toast.success(`${successCount} leaves approved`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaves"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
    } finally {
      setIsBulkApproving(false);
    }
  };

  const mutation = useMutation({
    mutationFn: updateLeaveStatus,
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
      <PageContainer className="flex flex-col gap-6 md:gap-7">
        <section className="rounded-3xl border border-border/70 bg-card/75 p-5 md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                Approvals · {pendingLeaves.length} pending
              </p>
              <h1 className="font-display text-4xl leading-none tracking-tight md:text-5xl">
                Three calls, <i className="text-primary">two minutes.</i>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Each request includes capacity context so you can approve
                quickly with confidence.
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canBulkApprove}
                      onClick={handleApproveAllSafe}
                    >
                      {isBulkApproving ? "Approving..." : "Approve all safe"}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canBulkApprove && safePendingLeaves.length === 0 && (
                  <TooltipContent>No safe leaves to approve</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Card className="border-border/70 bg-background/60">
              <CardContent className="p-4">
                <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  Pending requests
                </p>
                <p className="mt-1 font-mono text-3xl">
                  {pendingLeaves.length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Waiting on your decision
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/25 bg-amber-500/6">
              <CardContent className="p-4">
                <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  Conflict warnings
                </p>
                <p className="mt-1 font-mono text-3xl">{riskyCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  May impact squad capacity
                </p>
              </CardContent>
            </Card>
            <Card className="border-sky-500/25 bg-sky-500/6">
              <CardContent className="p-4">
                <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  Days requested
                </p>
                <p className="mt-1 font-mono text-3xl">
                  {pendingDays.toFixed(1)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Across pending
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton
                    key={`approval-skel-${i + 1}`}
                    className="h-44 w-full rounded-2xl"
                  />
                ))}
              </div>
            ) : pendingLeaves.length === 0 ? (
              <Card className="border-border/70 bg-card/70">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    No pending approvals.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingLeaves.map((leave) => {
                const comment = comments[leave.id] ?? "";
                const busy =
                  isBulkApproving ||
                  (mutation.isPending &&
                    mutation.variables?.leaveId === leave.id);
                const hasWarning = hasCapacityConflict(leave);

                return (
                  <Card
                    key={leave.id}
                    className={`border-border/70 bg-card/70 ${hasWarning ? "border-amber-500/35 bg-amber-500/6" : ""}`}
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold">
                            {leave.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatLeaveType(leave.type)} ·{" "}
                            {format(parseISO(leave.startDate), "MMM d")} →{" "}
                            {format(parseISO(leave.endDate), "MMM d")} ·{" "}
                            {getLeaveDurationDays(leave).toFixed(1)}d
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasWarning ? (
                            <Badge className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                              Conflict
                            </Badge>
                          ) : (
                            <Badge className="border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
                              Safe
                            </Badge>
                          )}
                          <Badge variant="outline">{leave.status}</Badge>
                        </div>
                      </div>

                      {leave.reason && (
                        <p className="rounded-lg border border-border/70 bg-background/60 p-2 text-sm text-muted-foreground">
                          “{leave.reason}”
                        </p>
                      )}

                      {leave.capacityWarning && (
                        <div className="rounded-md border border-amber-300/70 bg-amber-50/70 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                          <p className="flex items-start gap-1.5">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{leave.capacityWarning.message}</span>
                          </p>
                        </div>
                      )}

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

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
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
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="space-y-3 lg:sticky lg:top-20">
            <Card className="border-border/70 bg-card/70">
              <CardContent className="space-y-3 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                  Approve from Slack
                </p>
                <div className="rounded-xl border border-border/70 bg-[#1a1d21] p-3 text-zinc-200">
                  <p className="font-semibold text-sky-400">TeamFore App</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Pending request with capacity context appears instantly in
                    DM.
                  </p>
                  <div className="mt-2 rounded border-l-2 border-primary bg-zinc-800/70 p-2 text-xs">
                    <p>Inline approve/reject buttons</p>
                    <p>Conflict warning before approval</p>
                    <p>Deep link back to detailed request</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/70">
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-semibold">This week capacity</p>
                {(dashboardSummary?.availabilityByDay ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Capacity snapshot unavailable.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboardSummary?.availabilityByDay.map((day) => {
                      const pct =
                        day.total > 0
                          ? Math.round((day.available / day.total) * 100)
                          : 0;
                      const toneClass =
                        pct >= 80
                          ? "bg-emerald-500"
                          : pct >= 60
                            ? "bg-amber-500"
                            : "bg-rose-500";

                      return (
                        <div
                          key={day.date}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs"
                        >
                          <span className="font-mono text-muted-foreground">
                            {format(parseISO(day.date), "EEE")}
                          </span>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full ${toneClass}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-muted-foreground">
                            {day.available}/{day.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
