"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Sparkles, TriangleAlert, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AvailabilityBoard } from "@/components/calendar/availability-board";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { LeaveDetailsPanel } from "@/components/calendar/leave-details-panel";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useAvailabilityBoard } from "@/hooks/use-availability-board";
import { useCalendarLeaves } from "@/hooks/use-calendar-leaves";
import { usePublicHolidays } from "@/hooks/use-public-holidays";
import { useRole } from "@/hooks/use-role";
import { useTeams } from "@/hooks/use-teams";
import api from "@/lib/axios";
import type {
  AvailabilityStatus,
  LeaveRequest,
  PublicHoliday,
  WorkloadLevel,
} from "@/types/api";

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { role, canApprove } = useRole();
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    leaves: LeaveRequest[];
    holidays: PublicHoliday[];
  } | null>(null);

  // "" means "all teams"; any truthy string is a specific team id
  const [selectedTeamId, setSelectedTeamId] = useState("all");

  useEffect(() => {
    if (role !== "MANAGER") {
      return;
    }

    const managerTeamId = user?.teamId;

    if (!managerTeamId) {
      setSelectedTeamId("all");
      return;
    }

    setSelectedTeamId((current) =>
      current === managerTeamId ? current : managerTeamId,
    );
  }, [role, user?.teamId]);

  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

  const { data: teams = [] } = useTeams();

  const visibleTeams = useMemo(() => {
    if (role !== "MANAGER") {
      return teams;
    }

    if (!user?.teamId) {
      return [];
    }

    return teams.filter((team) => team.id === user.teamId);
  }, [role, teams, user?.teamId]);

  const canSelectAllTeams = role === "ADMIN";
  const effectiveTeamId =
    role === "MANAGER"
      ? (user?.teamId ?? undefined)
      : selectedTeamId === "all"
        ? undefined
        : selectedTeamId;

  const { data: leavesMap = {}, isLoading } = useCalendarLeaves(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    effectiveTeamId,
  );

  const showNoTeamMembersState =
    role !== "USER" && !isLoading && visibleTeams.length === 0;

  const { data: holidaysMap = {}, isLoading: isHolidayLoading } =
    usePublicHolidays({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
    });

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");

  const monthLeaves = useMemo(() => {
    const deduped = new Map<string, LeaveRequest>();
    for (const dayLeaves of Object.values(leavesMap)) {
      for (const leave of dayLeaves) {
        deduped.set(leave.id, leave);
      }
    }
    return Array.from(deduped.values());
  }, [leavesMap]);

  const monthHolidays = useMemo(() => {
    const deduped = new Map<string, PublicHoliday>();
    for (const dayHolidays of Object.values(holidaysMap)) {
      for (const holiday of dayHolidays) {
        deduped.set(holiday.id, holiday);
      }
    }
    return Array.from(deduped.values());
  }, [holidaysMap]);

  const approvedThisMonth = monthLeaves.filter(
    (leave) => leave.status === "APPROVED",
  ).length;
  const pendingThisMonth = monthLeaves.filter(
    (leave) => leave.status === "PENDING",
  ).length;

  const { data: availabilityBoard, isLoading: isAvailabilityLoading } =
    useAvailabilityBoard({
      date: selectedDateKey,
      teamId: effectiveTeamId,
    });

  const selectedLeaves =
    selectedDay?.leaves ?? leavesMap[selectedDateKey] ?? [];
  const selectedHolidays =
    selectedDay?.holidays ?? holidaysMap[selectedDateKey] ?? [];
  const onLeaveCount =
    availabilityBoard?.byStatus.find((item) => item.status === "ON_LEAVE")
      ?.count ?? 0;
  const remoteCount =
    availabilityBoard?.byStatus.find(
      (item) => item.status === "WORKING_REMOTELY",
    )?.count ?? 0;
  const selectedDateCapacity =
    availabilityBoard && availabilityBoard.total > 0
      ? Math.round(
          ((availabilityBoard.total - onLeaveCount) / availabilityBoard.total) *
            100,
        )
      : 0;

  const showCapacityHeatmap = canApprove;
  const scopedTotalMembers = availabilityBoard?.total ?? 0;

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: {
      status?: AvailabilityStatus;
      workload?: WorkloadLevel;
    }) => {
      await api.put("/availability/me", {
        ...payload,
        date: selectedDateKey,
      });
    },
    onSuccess: async () => {
      toast.success("Availability updated");
      await queryClient.invalidateQueries({ queryKey: ["availability-board"] });
    },
    onError: () => {
      toast.error("Could not update availability");
    },
  });

  const handlePrev = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));

  const handleNext = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const handleDayClick = (
    date: Date,
    leaves: LeaveRequest[],
    holidays: PublicHoliday[],
  ) => {
    setSelectedDate(date);
    if (leaves.length > 0 || holidays.length > 0) {
      setSelectedDay({ date, leaves, holidays });
    } else {
      setSelectedDay(null);
    }
  };

  return (
    <PageContainer className="flex flex-col gap-6 md:gap-7">
      <section className="rounded-3xl border border-border/70 bg-card/75 p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Calendar · {monthLeaves.length} requests ·{" "}
              {currentDate.getFullYear()}
            </p>
            <h1 className="font-display text-4xl leading-none tracking-tight md:text-5xl">
              Team schedule, <i className="text-primary">at a glance.</i>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Month-level visibility for leave plans, holidays, and team
              capacity before approvals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="rounded-full px-3">
              {canSelectAllTeams ? "All teams" : "Your team"}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3">
              {format(currentDate, "yyyy")}
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Card className="border-border/60 bg-background/65">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Total requests
              </p>
              <p className="mt-1 font-mono text-3xl">{monthLeaves.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/25 bg-emerald-500/5">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Approved
              </p>
              <p className="mt-1 font-mono text-3xl">{approvedThisMonth}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Requests approved
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/25 bg-amber-500/5">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Pending
              </p>
              <p className="mt-1 font-mono text-3xl">{pendingThisMonth}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Needs decision
              </p>
            </CardContent>
          </Card>
          <Card className="border-sky-500/25 bg-sky-500/5">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Public holidays
              </p>
              <p className="mt-1 font-mono text-3xl">{monthHolidays.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                In this month
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <CalendarHeader
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        teams={visibleTeams}
        selectedTeamId={
          role === "MANAGER" ? (user?.teamId ?? "all") : selectedTeamId
        }
        onTeamChange={setSelectedTeamId}
        showHeatmapLegend={showCapacityHeatmap}
        showAllTeamsOption={canSelectAllTeams}
      />

      {showNoTeamMembersState && (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-4">
            <p className="text-sm text-muted-foreground">
              Add your team to see the calendar.
            </p>
            <Button asChild size="sm">
              <Link href="/settings/team">Invite members</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="rounded-2xl border border-border/70 bg-card/65 p-2 md:p-3">
        <div
          key={monthKey}
          className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
        >
          <CalendarGrid
            currentDate={currentDate}
            leavesMap={leavesMap}
            holidaysMap={holidaysMap}
            totalMembers={scopedTotalMembers}
            showHeatmap={showCapacityHeatmap}
            isLoading={isLoading || isHolidayLoading}
            onDayClick={handleDayClick}
            selectedDate={selectedDate}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" />
              Squad availability board
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilityBoard
              date={selectedDateKey}
              board={availabilityBoard}
              isLoading={isAvailabilityLoading}
              currentUserId={user?.id}
              isUpdating={updateStatusMutation.isPending}
              onStatusChange={(status) =>
                updateStatusMutation.mutate({ status })
              }
              onWorkloadChange={(workload) =>
                updateStatusMutation.mutate({ workload })
              }
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {format(selectedDate, "EEE, MMM d")}
            </CardTitle>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border/60 bg-background/60 p-2">
                <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  Capacity
                </p>
                <p className="mt-1 font-mono text-xl">
                  {selectedDateCapacity}%
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-2">
                <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  On leave
                </p>
                <p className="mt-1 font-mono text-xl">{onLeaveCount}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-2">
                <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  Remote
                </p>
                <p className="mt-1 font-mono text-xl">{remoteCount}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedLeaves.length === 0 && selectedHolidays.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Select a date with leave activity or a holiday to inspect
                details.
              </p>
            ) : (
              <>
                {selectedLeaves.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                      Leaves
                    </p>
                    {selectedLeaves.map((leave) => (
                      <div
                        key={leave.id}
                        className="rounded-xl border border-border/70 bg-background/65 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {leave.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {leave.type.replaceAll("_", " ")}
                            </p>
                          </div>
                          <Badge variant="outline">{leave.status}</Badge>
                        </div>
                        {leave.capacityWarning?.shouldWarn && (
                          <p className="mt-2 flex items-start gap-1 text-xs text-amber-700 dark:text-amber-300">
                            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {leave.capacityWarning.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedHolidays.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                      Holidays
                    </p>
                    {selectedHolidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        className="rounded-xl border border-sky-500/20 bg-sky-500/8 p-3"
                      >
                        <p className="text-sm font-medium">{holiday.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {holiday.category}{" "}
                          {holiday.region ? `· ${holiday.region}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="flex items-center gap-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Tip
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click any day cell to open the full leave detail panel and
                review sessions, approver, and reason.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <LeaveDetailsPanel
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
        selectedDay={selectedDay}
      />
    </PageContainer>
  );
}
