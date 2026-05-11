import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";
import { BadRequestError } from "../utils/errors.js";

interface GetDashboardSummaryParams {
  userId: string;
  workspaceId: string;
  role: string;
  teamId: string | null;
}

interface GetReportsAnalyticsParams {
  userId: string;
  workspaceId: string;
  role: string;
  teamId: string | null;
  month?: string;
  from?: string;
  to?: string;
  teamFilterId?: string;
}

const LEAVE_TYPES = ["VACATION", "SICK", "PERSONAL", "CASUAL"] as const;

function startOfTodayUtc() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function startOfMonthUtc(month: string) {
  const [year, monthPart] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (monthPart ?? 1) - 1, 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function endOfMonthUtc(start: Date) {
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function startOfUtcDay(date: Date) {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function endOfUtcDay(date: Date) {
  const copy = new Date(date);
  copy.setUTCHours(23, 59, 59, 999);
  return copy;
}

function resolveRange({
  month,
  from,
  to,
}: {
  month?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}) {
  if (month) {
    const rangeStart = startOfMonthUtc(month);
    return {
      labelMonth: month,
      rangeStart,
      rangeEnd: endOfMonthUtc(rangeStart),
      usageYear: rangeStart.getUTCFullYear(),
    };
  }

  if (from && to) {
    const startDate = startOfUtcDay(new Date(from));
    const endDate = endOfUtcDay(new Date(to));

    return {
      labelMonth: `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, "0")}`,
      rangeStart: startDate,
      rangeEnd: endDate,
      usageYear: startDate.getUTCFullYear(),
    };
  }

  const defaultMonth = new Date().toISOString().slice(0, 7);
  const rangeStart = startOfMonthUtc(defaultMonth);
  return {
    labelMonth: defaultMonth,
    rangeStart,
    rangeEnd: endOfMonthUtc(rangeStart),
    usageYear: rangeStart.getUTCFullYear(),
  };
}

function overlapsRange(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date,
) {
  return start <= rangeEnd && end >= rangeStart;
}

function dayDiffUtc(from: Date, to: Date): number {
  const fromStart = startOfUtcDay(from).getTime();
  const toStart = startOfUtcDay(to).getTime();
  return Math.floor((toStart - fromStart) / 86_400_000);
}

function clampDateToRange(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

export const getDashboardSummary = async ({
  userId,
  workspaceId,
  role,
  teamId,
}: GetDashboardSummaryParams) => {
  const today = startOfTodayUtc();
  const next7Days = new Date(today);
  next7Days.setUTCDate(next7Days.getUTCDate() + 7);

  const leaveScope: Prisma.LeaveRequestWhereInput = {
    user: { workspaceId },
  };

  if (role === "USER") {
    if (teamId) {
      leaveScope.teamId = teamId;
    } else {
      leaveScope.userId = userId;
    }
  } else if (role === "MANAGER") {
    if (!teamId) {
      throw new BadRequestError("Manager must be assigned to a team");
    }
    leaveScope.teamId = teamId;
  }

  const userCountWhere: Prisma.UserWhereInput =
    role === "ADMIN"
      ? { workspaceId, isActive: true }
      : teamId
        ? { workspaceId, teamId, isActive: true }
        : { id: userId, isActive: true };

  const canApprove = role === "ADMIN" || role === "MANAGER";

  const scopeTeamPromise = teamId
    ? prisma.team.findFirst({
        where: { id: teamId, workspaceId },
        select: { name: true },
      })
    : Promise.resolve(null);

  const pendingWhere: Prisma.LeaveRequestWhereInput = {
    ...leaveScope,
    status: "PENDING",
  };

  const approvedWhere: Prisma.LeaveRequestWhereInput = {
    ...leaveScope,
    status: "APPROVED",
  };

  const availabilityRangeStart = new Date(today);
  const availabilityRangeEnd = new Date(today);
  availabilityRangeEnd.setUTCDate(availabilityRangeEnd.getUTCDate() + 6);

  const distributionRowsPromise = prisma.leaveRequest.groupBy({
    by: ["type"],
    where: approvedWhere,
    _count: { _all: true },
  });

  const overlappingApprovedLeavesPromise = prisma.leaveRequest.findMany({
    where: {
      ...approvedWhere,
      startDate: { lte: availabilityRangeEnd },
      endDate: { gte: availabilityRangeStart },
    },
    select: {
      startDate: true,
      endDate: true,
    },
  });

  const [
    totalUsers,
    pendingApprovals,
    todayLeaves,
    upcomingLeaves,
    distributionRows,
    overlappingApprovedLeaves,
    scopeTeam,
  ] = await Promise.all([
    prisma.user.count({ where: userCountWhere }),
    canApprove ? prisma.leaveRequest.count({ where: pendingWhere }) : 0,
    prisma.leaveRequest.count({
      where: {
        ...approvedWhere,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        ...approvedWhere,
        startDate: { gte: today, lte: next7Days },
      },
      orderBy: [{ startDate: "asc" }, { created_at: "desc" }],
      take: 10,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    distributionRowsPromise,
    overlappingApprovedLeavesPromise,
    scopeTeamPromise,
  ]);

  const availabilityScopeLabel =
    role === "ADMIN"
      ? "Workspace"
      : scopeTeam?.name
        ? `${scopeTeam.name} Team`
        : role === "USER"
          ? "Personal"
          : "Team";

  const leaveDistribution = LEAVE_TYPES.map((type) => ({
    type,
    count: distributionRows.find((row) => row.type === type)?._count._all ?? 0,
  }));

  const dayDiff = Array.from({ length: 8 }, () => 0);
  for (const leave of overlappingApprovedLeaves) {
    const clampedStart = clampDateToRange(
      startOfUtcDay(leave.startDate),
      availabilityRangeStart,
      availabilityRangeEnd,
    );
    const clampedEnd = clampDateToRange(
      startOfUtcDay(leave.endDate),
      availabilityRangeStart,
      availabilityRangeEnd,
    );

    if (clampedStart > clampedEnd) {
      continue;
    }

    const startIndex = dayDiffUtc(availabilityRangeStart, clampedStart);
    const endIndex = dayDiffUtc(availabilityRangeStart, clampedEnd);

    dayDiff[startIndex] = (dayDiff[startIndex] ?? 0) + 1;
    if (endIndex + 1 < dayDiff.length) {
      dayDiff[endIndex + 1] = (dayDiff[endIndex + 1] ?? 0) - 1;
    }
  }

  const availabilityByDay = Array.from({ length: 7 }, (_, offset) => {
    if (offset > 0) {
      dayDiff[offset] = (dayDiff[offset] ?? 0) + (dayDiff[offset - 1] ?? 0);
    }

    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + offset);
    date.setUTCHours(0, 0, 0, 0);

    const onLeaveCount = Math.max(dayDiff[offset] ?? 0, 0);

    return {
      date: date.toISOString(),
      available: Math.max(totalUsers - onLeaveCount, 0),
      onLeave: onLeaveCount,
      total: totalUsers,
    };
  });

  return {
    totalUsers,
    pendingApprovals,
    todayLeaves,
    upcomingLeaves,
    leaveDistribution,
    availabilityByDay,
    availabilityScopeLabel,
  };
};

export const getReportsAnalytics = async ({
  userId,
  workspaceId,
  role,
  teamId,
  month,
  from,
  to,
  teamFilterId,
}: GetReportsAnalyticsParams) => {
  const { labelMonth, rangeStart, rangeEnd, usageYear } = resolveRange({
    month,
    from,
    to,
  });

  const yearStart = new Date(Date.UTC(usageYear, 0, 1, 0, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(usageYear, 11, 31, 23, 59, 59, 999));

  const leaveScope: Prisma.LeaveRequestWhereInput = {
    user: { workspaceId },
    status: "APPROVED",
    startDate: { lte: yearEnd },
    endDate: { gte: yearStart },
  };

  if (role === "USER") {
    if (teamId) {
      leaveScope.teamId = teamId;
    } else {
      leaveScope.userId = userId;
    }
  } else if (role === "MANAGER") {
    if (!teamId) {
      throw new BadRequestError("Manager must be assigned to a team");
    }
    leaveScope.teamId = teamId;
  } else if (teamFilterId) {
    leaveScope.teamId = teamFilterId;
  }

  const [leaves, teams] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: leaveScope,
      select: {
        id: true,
        type: true,
        teamId: true,
        startDate: true,
        endDate: true,
      },
    }),
    prisma.team.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    }),
  ]);

  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));

  const monthDiff = Array.from({ length: 13 }, () => 0);
  const leaveTypeCounts = new Map<string, number>(
    LEAVE_TYPES.map((type) => [type, 0]),
  );
  const teamCounts = new Map<string, number>();

  for (const leave of leaves) {
    const startMonthIndex = Math.max(
      0,
      leave.startDate.getUTCFullYear() < usageYear
        ? 0
        : leave.startDate.getUTCMonth(),
    );
    const endMonthIndex = Math.min(
      11,
      leave.endDate.getUTCFullYear() > usageYear
        ? 11
        : leave.endDate.getUTCMonth(),
    );

    if (startMonthIndex <= endMonthIndex) {
      monthDiff[startMonthIndex] = (monthDiff[startMonthIndex] ?? 0) + 1;
      if (endMonthIndex + 1 < monthDiff.length) {
        monthDiff[endMonthIndex + 1] = (monthDiff[endMonthIndex + 1] ?? 0) - 1;
      }
    }

    if (!overlapsRange(leave.startDate, leave.endDate, rangeStart, rangeEnd)) {
      continue;
    }

    leaveTypeCounts.set(leave.type, (leaveTypeCounts.get(leave.type) ?? 0) + 1);
    teamCounts.set(leave.teamId, (teamCounts.get(leave.teamId) ?? 0) + 1);
  }

  let runningMonthCount = 0;
  const usageByMonth = Array.from({ length: 12 }, (_, monthIndex) => {
    runningMonthCount += monthDiff[monthIndex] ?? 0;

    const start = new Date(Date.UTC(usageYear, monthIndex, 1));
    return {
      month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
      count: runningMonthCount,
    };
  });

  const leaveByType = LEAVE_TYPES.map((type) => ({
    type,
    count: leaveTypeCounts.get(type) ?? 0,
  }));

  const leaveByTeam = Array.from(teamCounts.entries())
    .map(([teamKey, count]) => ({
      teamId: teamKey,
      teamName: teamNameById.get(teamKey) ?? "Unknown",
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    month: labelMonth,
    from: rangeStart.toISOString().slice(0, 10),
    to: rangeEnd.toISOString().slice(0, 10),
    leaveUsageByMonth: usageByMonth,
    leaveByType,
    leaveByTeam,
  };
};
