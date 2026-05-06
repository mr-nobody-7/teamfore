import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";
import type {
  AvailabilityBoardQuery,
  AvailabilityStatusValue,
  SetMyAvailabilityInput,
  WorkloadLevelValue,
} from "../types/index.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { sendAvailabilityNotification } from "./slack.service.js";

const ALL_AVAILABILITY_STATUSES: AvailabilityStatusValue[] = [
  "AVAILABLE",
  "ON_LEAVE",
  "WORKING_REMOTELY",
  "HALF_DAY",
  "BUSY",
  "FOCUS_TIME",
];

const ALL_WORKLOAD_LEVELS: WorkloadLevelValue[] = ["LIGHT", "NORMAL", "HEAVY"];

function normalizeDate(date?: string) {
  const dateKey = date ?? new Date().toISOString().slice(0, 10);
  const normalized = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(normalized.getTime())) {
    throw new BadRequestError("Invalid date");
  }

  return {
    date: normalized,
    dateKey,
    dayEnd: new Date(`${dateKey}T23:59:59.999Z`),
  };
}

interface GetAvailabilityBoardParams {
  userId: string;
  workspaceId: string;
  role: string;
  teamId: string | null;
  query: AvailabilityBoardQuery;
}

export const getAvailabilityBoard = async ({
  userId,
  workspaceId,
  role,
  teamId,
  query,
}: GetAvailabilityBoardParams) => {
  const { date, dateKey, dayEnd } = normalizeDate(query.date);

  const userWhere: Prisma.UserWhereInput = {
    workspaceId,
    isActive: true,
  };

  if (role === "USER") {
    if (teamId) {
      userWhere.teamId = teamId;
    } else {
      userWhere.id = userId;
    }
  } else if (role === "MANAGER") {
    if (!teamId) {
      throw new BadRequestError("Manager must be assigned to a team");
    }
    userWhere.teamId = teamId;
  } else if (query.team_id) {
    userWhere.teamId = query.team_id;
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      name: true,
      email: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  if (users.length === 0) {
    return {
      date: dateKey,
      total: 0,
      byStatus: ALL_AVAILABILITY_STATUSES.map((status) => ({ status, count: 0 })),
      byWorkload: ALL_WORKLOAD_LEVELS.map((workload) => ({
        workload,
        count: 0,
      })),
      members: [],
    };
  }

  const userIds = users.map((user) => user.id);

  const [statusRows, workloadRows, leaveRows] = await Promise.all([
    prisma.userAvailabilityStatus.findMany({
      where: {
        workspaceId,
        date,
        userId: { in: userIds },
      },
      select: {
        userId: true,
        status: true,
      },
    }),
    prisma.userWorkloadStatus.findMany({
      where: {
        workspaceId,
        date,
        userId: { in: userIds },
      },
      select: {
        userId: true,
        workload: true,
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        userId: { in: userIds },
        status: "APPROVED",
        startDate: { lte: dayEnd },
        endDate: { gte: date },
      },
      select: {
        userId: true,
      },
    }),
  ]);

  const savedStatusByUser = new Map(statusRows.map((row) => [row.userId, row.status]));
  const savedWorkloadByUser = new Map(
    workloadRows.map((row) => [row.userId, row.workload]),
  );
  const onLeaveUserIds = new Set(leaveRows.map((row) => row.userId));

  const members = users.map((user) => {
    const status: AvailabilityStatusValue = onLeaveUserIds.has(user.id)
      ? "ON_LEAVE"
      : (savedStatusByUser.get(user.id) ?? "AVAILABLE");

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      teamId: user.teamId,
      teamName: user.team?.name ?? null,
      status,
      workload: savedWorkloadByUser.get(user.id) ?? "NORMAL",
      isOnLeave: onLeaveUserIds.has(user.id),
    };
  });

  const countByStatus = members.reduce<Record<AvailabilityStatusValue, number>>(
    (acc, member) => {
      acc[member.status] += 1;
      return acc;
    },
    {
      AVAILABLE: 0,
      ON_LEAVE: 0,
      WORKING_REMOTELY: 0,
      HALF_DAY: 0,
      BUSY: 0,
      FOCUS_TIME: 0,
    },
  );

  const countByWorkload = members.reduce<Record<WorkloadLevelValue, number>>(
    (acc, member) => {
      acc[member.workload] += 1;
      return acc;
    },
    {
      LIGHT: 0,
      NORMAL: 0,
      HEAVY: 0,
    },
  );

  return {
    date: dateKey,
    total: members.length,
    byStatus: ALL_AVAILABILITY_STATUSES.map((status) => ({
      status,
      count: countByStatus[status],
    })),
    byWorkload: ALL_WORKLOAD_LEVELS.map((workload) => ({
      workload,
      count: countByWorkload[workload],
    })),
    members,
  };
};

export const setMyAvailability = async (
  userId: string,
  workspaceId: string,
  input: SetMyAvailabilityInput,
) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      workspaceId,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!input.status && !input.workload) {
    throw new BadRequestError("At least one of status or workload is required");
  }

  const { date, dateKey, dayEnd } = normalizeDate(input.date);

  let savedStatus: AvailabilityStatusValue | null = null;
  let savedWorkload: WorkloadLevelValue | null = null;

  if (input.status) {
    const availability = await prisma.userAvailabilityStatus.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      create: {
        userId,
        workspaceId,
        date,
        status: input.status,
      },
      update: {
        status: input.status,
      },
      select: {
        status: true,
      },
    });

    savedStatus = availability.status;
  }

  if (input.workload) {
    const workload = await prisma.userWorkloadStatus.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      create: {
        userId,
        workspaceId,
        date,
        workload: input.workload,
      },
      update: {
        workload: input.workload,
      },
      select: {
        workload: true,
      },
    });

    savedWorkload = workload.workload;
  }

  const [currentStatus, currentWorkload, onLeaveCount] = await Promise.all([
    savedStatus
      ? Promise.resolve({ status: savedStatus })
      : prisma.userAvailabilityStatus.findUnique({
          where: {
            userId_date: {
              userId,
              date,
            },
          },
          select: { status: true },
        }),
    savedWorkload
      ? Promise.resolve({ workload: savedWorkload })
      : prisma.userWorkloadStatus.findUnique({
          where: {
            userId_date: {
              userId,
              date,
            },
          },
          select: { workload: true },
        }),
    prisma.leaveRequest.count({
      where: {
        userId,
        status: "APPROVED",
        startDate: { lte: dayEnd },
        endDate: { gte: date },
      },
    }),
  ]);

  const effectiveStatus =
    onLeaveCount > 0 ? "ON_LEAVE" : (currentStatus?.status ?? "AVAILABLE");
  const effectiveWorkload = currentWorkload?.workload ?? "NORMAL";

  if (input.status) {
    void sendAvailabilityNotification(workspaceId, {
      userName: user.name,
      status: input.status,
      date: date.toDateString(),
    }).catch((err: unknown) => console.error("Slack notification error:", err));
  }

  return {
    date: dateKey,
    status: effectiveStatus,
    savedStatus,
    workload: effectiveWorkload,
    savedWorkload,
    isOnLeave: onLeaveCount > 0,
  };
};
