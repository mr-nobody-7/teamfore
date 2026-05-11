"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  MessageSquareText,
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
  const currentTime = useMemo(() => format(new Date(), "HH:mm"), []);
  const dayLabel = useMemo(() => format(new Date(), "EEEE, MMM d"), []);

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

  const weekCapacity = useMemo(
    () =>
      formattedAvailability.map((day) => {
        const capacityPct =
          day.total > 0 ? Math.round((day.available / day.total) * 100) : 0;
        const tone =
          capacityPct >= 85 ? "full" : capacityPct >= 60 ? "med" : "low";
        return { ...day, capacityPct, tone };
      }),
    [formattedAvailability],
  );

  const avgCapacity = useMemo(() => {
    if (weekCapacity.length === 0) return 0;
    const sum = weekCapacity.reduce((acc, day) => acc + day.capacityPct, 0);
    return Math.round(sum / weekCapacity.length);
  }, [weekCapacity]);

  const minCapacity = useMemo(() => {
    if (weekCapacity.length === 0) return 0;
    return Math.min(...weekCapacity.map((day) => day.capacityPct));
  }, [weekCapacity]);

  const sprintRisk = useMemo(() => {
    if (minCapacity >= 80) return "Low";
    if (minCapacity >= 60) return "Med";
    return "High";
  }, [minCapacity]);

  const showWorkspaceWelcome =
    !isLoading &&
    (summary?.totalUsers ?? 0) <= 1 &&
    (summary?.todayLeaves ?? 0) === 0 &&
    formattedUpcomingLeaves.length === 0;

  const dashboardChanges =
    (summary?.pendingApprovals ?? 0) + (summary?.todayLeaves ?? 0);

  return (
    <PageContainer className="space-y-6 md:space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-5 shadow-xl shadow-black/10 md:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.2),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_35%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              {dayLabel} · team pulse
            </p>
            <p className="font-display text-4xl leading-none tracking-tight md:text-6xl">
              Welcome back,{" "}
              <i className="text-primary">
                {user?.name?.split(" ")[0] ?? "Team"}
              </i>
            </p>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {dashboardChanges} change{dashboardChanges === 1 ? "" : "s"} since
              last check-in. Team pulse, leave flow, and sprint readiness in one
              view.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">{dayLabel}</p>
            <p className="font-mono text-3xl font-medium tracking-tight md:text-4xl">
              {currentTime}
            </p>
          </div>
        </div>
      </section>

      {showWorkspaceWelcome && (
        <Card className="border-primary/25 bg-primary/5">
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(canApprove
          ? [
              {
                label: "On Leave Today",
                value: summary?.todayLeaves ?? 0,
                sub: `${summary?.totalUsers ?? 0} users in workspace`,
                icon: CalendarCheck2,
                tone: "from-rose-500/22",
              },
              {
                label: "Pending Approvals",
                value: summary?.pendingApprovals ?? 0,
                sub: "Requests waiting on your action",
                icon: ClipboardList,
                tone: "from-amber-500/22",
              },
              {
                label: "This Week Capacity",
                value: `${avgCapacity}%`,
                sub: `${summary?.availabilityScopeLabel ?? "Team"} availability avg`,
                icon: Users,
                tone: "from-emerald-500/22",
              },
              {
                label: "Sprint Risk",
                value: sprintRisk,
                sub: `Lowest day at ${minCapacity}% capacity`,
                icon: AlertTriangle,
                tone:
                  sprintRisk === "Low"
                    ? "from-emerald-500/18"
                    : sprintRisk === "Med"
                      ? "from-amber-500/18"
                      : "from-rose-500/18",
              },
            ]
          : [
              {
                label: "Total Users",
                value: summary?.totalUsers ?? 0,
                sub: "Active users in scope",
                icon: Users,
                tone: "from-primary/22",
              },
              {
                label: "Leaves Today",
                value: summary?.todayLeaves ?? 0,
                sub: "People currently on leave",
                icon: CalendarCheck2,
                tone: "from-rose-500/22",
              },
              {
                label: "Upcoming Leaves",
                value: upcomingLeaves.length,
                sub: "Starting in next 7 days",
                icon: CalendarDays,
                tone: "from-sky-500/22",
              },
            ]
        ).map((stat) => (
          <Card
            key={stat.label}
            className="relative overflow-hidden border-border/70 bg-card/70"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-radial-[at_85%_90%] ${stat.tone} to-transparent`}
            />
            <CardContent className="relative p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <stat.icon className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <p className="font-mono text-4xl leading-none tracking-tight">
                  {stat.value}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {canApprove && (
        <Card className="overflow-hidden border-border/70 bg-card/75">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-3xl leading-none tracking-tight">
              A clear week, with <i className="text-primary">Friday</i> to
              watch.
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Next 7 days · {summary?.availabilityScopeLabel ?? "Team"}
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {Array.from({ length: 7 }, (_, idx) => (
                  <Skeleton
                    key={`capacity-skel-${idx + 1}`}
                    className="h-24 w-full"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {weekCapacity.map((day) => (
                  <div
                    key={day.date}
                    className={`rounded-xl border p-3 ${
                      day.tone === "full"
                        ? "border-emerald-500/25 bg-emerald-500/7"
                        : day.tone === "med"
                          ? "border-amber-500/25 bg-amber-500/7"
                          : "border-rose-500/25 bg-rose-500/7"
                    } ${day.date === todayDateKey ? "ring-1 ring-primary/40" : ""}`}
                  >
                    <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                      {day.label} · {day.fullDate}
                    </p>
                    <p className="mt-2 font-mono text-2xl leading-none">
                      {day.capacityPct}%
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {day.available} of {day.total} available
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canApprove && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <StandupBoard
            date={todayDateKey}
            board={standupBoard}
            isLoading={isStandupLoading}
            scopeLabel={summary?.availabilityScopeLabel}
          />

          {/* Pending approvals widget — manager only */}
          {isManager ? (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">
                  Approvals Waiting on You
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
                    No pending requests
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
          ) : (
            <Card className="bg-card/75">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <MessageSquareText className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">
                  Live in Slack
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Daily standup digest posts at 9:00 AM.</p>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="font-medium text-foreground">Commands</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      "/whos-out",
                      "/my-leaves",
                      "/apply-leave",
                      "/team-status",
                    ].map((command) => (
                      <span
                        key={command}
                        className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] text-primary"
                      >
                        {command}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
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
                    <div className="flex items-center justify-between gap-2 py-3">
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">
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

        <Card className="bg-card/75">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MessageSquareText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              Live in Slack
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border border-border/70 bg-[#1a1d21] p-3 text-zinc-200">
              <p className="font-semibold text-sky-400">TeamFore App</p>
              <p className="mt-1 text-xs text-zinc-400">
                Good morning. Here&apos;s your standup digest.
              </p>
              <div className="mt-2 rounded border-l-2 border-primary bg-zinc-800/70 p-2 text-xs">
                <p>
                  Available:{" "}
                  {summary?.totalUsers ?? 0 - (summary?.todayLeaves ?? 0)}
                </p>
                <p>Off today: {summary?.todayLeaves ?? 0}</p>
                <p>Remote: based on availability board status</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["/whos-out", "/my-leaves", "/apply-leave", "/team-status"].map(
                (command) => (
                  <span
                    key={command}
                    className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] text-primary"
                  >
                    {command}
                  </span>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution + availability insights */}
      {canApprove && (
        <div className="grid gap-6 lg:grid-cols-2">
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
