"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { LeaveRequest, LeaveStatus } from "@/types/api";

const STATUS_OPTIONS: Array<"ALL" | LeaveStatus> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

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

export default function LeavesPage() {
  const queryClient = useQueryClient();
  const { role } = useRole();
  const { user } = useAuth();
  const [status, setStatus] = useState<"ALL" | LeaveStatus>("ALL");
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);

      const response = await api.get("/leave/export", {
        params: status !== "ALL" ? { status } : undefined,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `teamfore-leaves-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const leaves = data?.leaves ?? [];

  const summary = useMemo(() => {
    let approvedDays = 0;
    let pendingDays = 0;
    let rejectedCount = 0;

    for (const leave of leaves) {
      if (leave.status === "APPROVED") {
        approvedDays += getLeaveDurationDays(leave);
      }
      if (leave.status === "PENDING") {
        pendingDays += getLeaveDurationDays(leave);
      }
      if (leave.status === "REJECTED") {
        rejectedCount += 1;
      }
    }

    return {
      approvedDays,
      pendingDays,
      rejectedCount,
    };
  }, [leaves]);

  return (
    <PageContainer className="flex flex-col gap-6 md:gap-7">
      <section className="rounded-3xl border border-border/70 bg-card/75 p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              {role === "USER"
                ? "My leaves"
                : role === "MANAGER"
                  ? "Team leaves"
                  : "All leaves"}{" "}
              · {leaves.length} records · {new Date().getFullYear()}
            </p>
            <h1 className="font-display text-4xl leading-none tracking-tight md:text-5xl">
              Your leave history, <i className="text-primary">at a glance.</i>
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as "ALL" | LeaveStatus)}
            >
              <SelectTrigger className="w-44 border-border/70 bg-background/70">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === "ALL" ? "All status" : item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(role === "ADMIN" || role === "MANAGER") && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExportCsv}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Card className="border-emerald-500/25 bg-emerald-500/6">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Approved
              </p>
              <p className="mt-1 font-mono text-3xl">
                {summary.approvedDays.toFixed(1)}
                <span className="ml-1 text-sm text-muted-foreground">days</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Across approved requests
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/25 bg-amber-500/6">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Pending
              </p>
              <p className="mt-1 font-mono text-3xl">
                {summary.pendingDays.toFixed(1)}
                <span className="ml-1 text-sm text-muted-foreground">days</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Awaiting manager
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-background/60">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Total requests
              </p>
              <p className="mt-1 font-mono text-3xl">{leaves.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data?.total ?? leaves.length} in filtered view
              </p>
            </CardContent>
          </Card>
          <Card className="border-rose-500/25 bg-rose-500/6">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Rejected
              </p>
              <p className="mt-1 font-mono text-3xl">{summary.rejectedCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Needs revision
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="overflow-hidden border-border/70 bg-card/70">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={`leave-skel-${i + 1}`} className="h-14 w-full" />
              ))}
            </div>
          ) : leaves.length === 0 ? (
            <div className="flex flex-col items-start gap-3 p-4">
              <p className="text-sm text-muted-foreground">
                No leave requests yet.
              </p>
              <Button asChild size="sm">
                <Link href="/leaves/apply">Apply for leave</Link>
              </Button>
            </div>
          ) : (
            <div>
              <div className="hidden grid-cols-[1.5fr_1.15fr_0.95fr_0.8fr_0.95fr_0.9fr_0.7fr] gap-3 border-b border-border/70 bg-muted/35 px-4 py-2 text-[11px] font-mono tracking-[0.12em] text-muted-foreground uppercase md:grid">
                <span>Person</span>
                <span>Dates</span>
                <span>Type</span>
                <span>Duration</span>
                <span>Status</span>
                <span>Filed</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-border/60">
                {leaves.map((leave) => {
                  const canCancel =
                    leave.status === "PENDING" && leave.userId === user?.id;

                  return (
                    <div
                      key={leave.id}
                      className="grid gap-2 px-4 py-3 md:grid-cols-[1.5fr_1.15fr_0.95fr_0.8fr_0.95fr_0.9fr_0.7fr] md:items-center md:gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{leave.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {leave.user.email}
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground md:text-sm">
                        {format(parseISO(leave.startDate), "MMM d")} →{" "}
                        {format(parseISO(leave.endDate), "MMM d")}
                      </div>

                      <div>
                        <Badge variant="outline">
                          {formatLeaveType(leave.type)}
                        </Badge>
                      </div>

                      <div className="font-mono text-sm">
                        {getLeaveDurationDays(leave).toFixed(1)}d
                      </div>

                      <div>
                        <Badge
                          variant={
                            leave.status === "APPROVED" ? "default" : "outline"
                          }
                        >
                          {leave.status}
                        </Badge>
                      </div>

                      <div className="font-mono text-xs text-muted-foreground">
                        {format(parseISO(leave.created_at), "MMM d")}
                      </div>

                      <div className="flex justify-end">
                        {canCancel ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelMutation.mutate(leave.id)}
                            disabled={cancelMutation.isPending}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>

                      {leave.comment && (
                        <p className="text-xs text-muted-foreground md:col-span-7">
                          Comment: {leave.comment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
