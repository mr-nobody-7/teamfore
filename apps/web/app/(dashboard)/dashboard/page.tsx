"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  PieChart,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { StandupBoard } from "@/components/dashboard/standup-board";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/contexts/auth-context";
import { useAvailabilityBoard } from "@/hooks/use-availability-board";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { useLeaves } from "@/hooks/use-leaves";
import { useRole } from "@/hooks/use-role";
import api from "@/lib/axios";
import { formatLeaveType } from "@/lib/utils";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { canApprove, isManager } = useRole();
  const { data: summary, isLoading } = useDashboardSummary();
  const todayDateKey = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: standupBoard, isLoading: isStandupLoading } =
    useAvailabilityBoard({
      date: todayDateKey,
    });

  const { data: pendingLeaves, isLoading: pendingLoading } = useLeaves(
    {
      status: "PENDING",
      page: 1,
      limit: 5,
    },
    { enabled: isManager, staleTime: 30_000 },
  );

  const decisionMutation = useMutation({
    mutationFn: async ({
      leaveId,
      status,
    }: {
      leaveId: string;
      status: "APPROVED" | "REJECTED";
    }) => {
      await api.patch(`/leave/${leaveId}/status`, { status });
    },
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.status === "APPROVED" ? "Leave approved" : "Leave rejected",
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["leaves"] }),
      ]);
    },
    onError: () => {
      toast.error("Could not update leave status");
    },
  });

  const DISTRIBUTION_COLOR: Record<string, string> = {
    VACATION: "#3b82f6",
    SICK: "#ef4444",
    PERSONAL: "#a855f7",
    CASUAL: "#f59e0b",
  };

  const upcomingLeaves = useMemo(
    () => summary?.upcomingLeaves ?? [],
    [summary?.upcomingLeaves],
  );

  const leaveDistribution = useMemo(
    () => summary?.leaveDistribution ?? [],
    [summary?.leaveDistribution],
  );

  const availabilityByDay = useMemo(
    () => summary?.availabilityByDay ?? [],
    [summary?.availabilityByDay],
  );

  const formattedUpcomingLeaves = useMemo(
    () =>
      upcomingLeaves.map((leave) => ({
        ...leave,
        dateLabel: `${format(parseISO(leave.startDate), "MMM d")} → ${format(parseISO(leave.endDate), "MMM d")}`,
      })),
    [upcomingLeaves],
  );

  const formattedAvailability = useMemo(
    () =>
      availabilityByDay.map((day) => ({
        ...day,
        label: format(parseISO(day.date), "EEE"),
        fullDate: format(parseISO(day.date), "MMM d"),
      })),
    [availabilityByDay],
  );

  const showWorkspaceWelcome =
    !isLoading &&
    (summary?.totalUsers ?? 0) <= 1 &&
    (summary?.todayLeaves ?? 0) === 0 &&
    formattedUpcomingLeaves.length === 0;

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your team today.
        </p>
      </div>

      {showWorkspaceWelcome && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome to your new workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You&apos;re all set. Start by taking one of these quick actions.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <Link
                href="/leaves/apply"
                className="rounded-lg border p-4 text-sm font-medium hover:bg-muted/40"
              >
                Apply for leave
              </Link>
              <Link
                href="/calendar"
                className="rounded-lg border p-4 text-sm font-medium hover:bg-muted/40"
              >
                View calendar
              </Link>
              <Link
                href="/settings/team"
                className="rounded-lg border p-4 text-sm font-medium hover:bg-muted/40"
              >
                Invite your team
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={summary?.totalUsers}
          description="Active users in scope"
          icon={Users}
          isLoading={isLoading}
        />

        <StatCard
          title="Leaves Today"
          value={summary?.todayLeaves}
          description="People currently on leave"
          icon={CalendarCheck2}
          isLoading={isLoading}
        />

        {canApprove && (
          <StatCard
            title="Pending Approvals"
            value={summary?.pendingApprovals}
            description="Requests awaiting your action"
            icon={ClipboardList}
            isLoading={isLoading}
            iconClassName="bg-amber-100"
            className={
              (summary?.pendingApprovals ?? 0) > 0
                ? "border-amber-300"
                : undefined
            }
          />
        )}

        <StatCard
          title="Upcoming Leaves"
          value={upcomingLeaves.length}
          description="Starting in next 7 days"
          icon={CalendarDays}
          isLoading={isLoading}
        />
      </div>

      {canApprove && (
        <div className="mt-8">
          <StandupBoard
            date={todayDateKey}
            board={standupBoard}
            isLoading={isStandupLoading}
            scopeLabel={summary?.availabilityScopeLabel}
          />
        </div>
      )}

      {/* Pending approvals widget — manager only */}
      {isManager && (
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, idx) => (
                    <Skeleton
                      key={`pending-skel-${idx + 1}`}
                      className="h-14 w-full"
                    />
                  ))}
                </div>
              ) : !(pendingLeaves?.leaves.length ?? 0) ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No pending requests 🎉
                </p>
              ) : (
                <div className="divide-y">
                  {pendingLeaves?.leaves.map((leave, idx) => {
                    const isBusy =
                      decisionMutation.isPending &&
                      decisionMutation.variables?.leaveId === leave.id;

                    return (
                      <div key={leave.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {leave.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(leave.startDate), "MMM d")} →{" "}
                              {format(parseISO(leave.endDate), "MMM d")}
                            </span>
                            {leave.capacityWarning && (
                              <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {leave.capacityWarning.message}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {formatLeaveType(leave.type)}
                            </Badge>
                            <Button
                              size="xs"
                              onClick={() =>
                                decisionMutation.mutate({
                                  leaveId: leave.id,
                                  status: "APPROVED",
                                })
                              }
                              disabled={isBusy}
                            >
                              Approve
                            </Button>
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() =>
                                decisionMutation.mutate({
                                  leaveId: leave.id,
                                  status: "REJECTED",
                                })
                              }
                              disabled={isBusy}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>

                        {idx < (pendingLeaves?.leaves.length ?? 0) - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              Upcoming Leaves (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, idx) => (
                  <Skeleton
                    key={`upcoming-skel-${idx + 1}`}
                    className="h-12 w-full"
                  />
                ))}
              </div>
            ) : formattedUpcomingLeaves.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No upcoming leaves in the next 7 days.
              </p>
            ) : (
              <div className="divide-y">
                {formattedUpcomingLeaves.map((leave, i) => (
                  <div key={leave.id}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {leave.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {leave.dateLabel}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {formatLeaveType(leave.type)}
                      </Badge>
                    </div>
                    {i < formattedUpcomingLeaves.length - 1 && (
                      <Separator className="my-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribution + availability insights */}
      {canApprove && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <PieChart className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">
                Leave Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={leaveDistribution}
                        dataKey="count"
                        nameKey="type"
                        innerRadius={45}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {leaveDistribution.map((entry) => (
                          <Cell
                            key={entry.type}
                            fill={DISTRIBUTION_COLOR[entry.type] ?? "#94a3b8"}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Next 7 Days Team Availability
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {summary?.availabilityScopeLabel ?? "Team"}
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 7 }, (_, idx) => (
                    <Skeleton
                      key={`availability-skel-${idx + 1}`}
                      className="h-10 w-full"
                    />
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {formattedAvailability.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="text-sm font-medium">{day.label}</div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {day.available} available
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {day.fullDate} · {day.onLeave} on leave / {day.total}{" "}
                          total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
