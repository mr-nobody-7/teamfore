import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";
import type {
  ApplyLeaveInput,
  LeaveCapacityWarning,
  ListLeaveQuery,
  UpdateLeaveStatusInput,
} from "../types/index.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors.js";
import { sendMail } from "./mail.service.js";
import { isLeaveTypeEnabledForWorkspace } from "./settings.service.js";
import {
  sendLeaveNotification,
  sendLeaveStatusNotification,
} from "./slack.service.js";

// ── Session ordering helpers ──────────────────────────────────────────────────
// Map each leave period to a range of "half-day slots" so overlap detection
// works at session granularity, not just calendar-day granularity.
//
// Slot layout per day (d = days since epoch):
//   FIRST_HALF  → d*2      (morning only)
//   SECOND_HALF → d*2 + 1  (afternoon only)
//   FULL_DAY    → d*2 … d*2+1 (both halves)
//
// A period [startSlot, endSlot] overlaps [a, b] when startSlot <= b AND endSlot >= a.

type SessionValue = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";

function toStartSlot(date: Date, session: SessionValue): number {
  const day = Math.floor(date.getTime() / 86_400_000);
  // SECOND_HALF starts in the afternoon
  return session === "SECOND_HALF" ? day * 2 + 1 : day * 2;
}

function toEndSlot(date: Date, session: SessionValue): number {
  const day = Math.floor(date.getTime() / 86_400_000);
  // FIRST_HALF ends in the morning
  return session === "FIRST_HALF" ? day * 2 : day * 2 + 1;
}

const DEFAULT_TEAM_MIN_CAPACITY_WARNING_PERCENT = 50;

function resolveTeamCapacityWarningThresholdPercent(): number {
  const raw = process.env.TEAM_MIN_CAPACITY_WARNING_PERCENT;

  if (!raw) {
    return DEFAULT_TEAM_MIN_CAPACITY_WARNING_PERCENT;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_TEAM_MIN_CAPACITY_WARNING_PERCENT;
  }

  return Math.min(Math.max(Math.round(parsed), 0), 100);
}

const TEAM_MIN_CAPACITY_WARNING_PERCENT =
  resolveTeamCapacityWarningThresholdPercent();

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildLeaveSubmittedHtml(params: {
  approverName?: string;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  note?: string | null;
}): string {
  const noteSection = params.note
    ? `<p><strong>Note:</strong> ${params.note}</p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 12px;">New Leave Request Submitted</h2>
      <p>Hi ${params.approverName ?? "Manager"},</p>
      <p>A new leave request has been submitted and needs your review.</p>
      <p><strong>Employee:</strong> ${params.employeeName}</p>
      <p><strong>Leave type:</strong> ${params.leaveType}</p>
      <p><strong>Dates:</strong> ${formatDate(params.startDate)} to ${formatDate(params.endDate)}</p>
      ${noteSection}
      <p>Please review it in TeamFore.</p>
    </div>
  `;
}

function buildLeaveApprovedHtml(params: {
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  approvedBy: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 12px;">Your Leave Request Was Approved</h2>
      <p>Hi ${params.employeeName},</p>
      <p>Your leave request has been approved.</p>
      <p><strong>Leave type:</strong> ${params.leaveType}</p>
      <p><strong>Dates:</strong> ${formatDate(params.startDate)} to ${formatDate(params.endDate)}</p>
      <p><strong>Approved by:</strong> ${params.approvedBy}</p>
      <p>Thanks for keeping your team informed.</p>
    </div>
  `;
}

function buildLeaveRejectedHtml(params: {
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  rejectedBy: string;
  comment?: string | null;
}): string {
  const commentSection = params.comment
    ? `<p><strong>Comment:</strong> ${params.comment}</p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 12px;">Your Leave Request Was Rejected</h2>
      <p>Hi ${params.employeeName},</p>
      <p>Your leave request has been rejected.</p>
      <p><strong>Leave type:</strong> ${params.leaveType}</p>
      <p><strong>Dates:</strong> ${formatDate(params.startDate)} to ${formatDate(params.endDate)}</p>
      <p><strong>Rejected by:</strong> ${params.rejectedBy}</p>
      ${commentSection}
      <p>Please contact your manager if you need clarification.</p>
    </div>
  `;
}

function notifyLeaveSubmitted(params: {
  managerEmail: string;
  managerName?: string;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  note?: string | null;
}) {
  const html = buildLeaveSubmittedHtml({
    ...(params.managerName ? { approverName: params.managerName } : {}),
    employeeName: params.employeeName,
    leaveType: params.leaveType,
    startDate: params.startDate,
    endDate: params.endDate,
    ...(params.note !== undefined ? { note: params.note } : {}),
  });

  void sendMail(
    params.managerEmail,
    "New leave request submitted",
    html,
  ).catch((err: unknown) => console.error("Mail error:", err));
}

function notifyLeaveApproved(params: {
  employeeEmail: string;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  approvedBy: string;
}) {
  const html = buildLeaveApprovedHtml(params);

  void sendMail(params.employeeEmail, "Your leave request was approved", html).catch(
    (err: unknown) => console.error("Mail error:", err),
  );
}

function notifyLeaveRejected(params: {
  employeeEmail: string;
  employeeName: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  rejectedBy: string;
  comment?: string | null;
}) {
  const html = buildLeaveRejectedHtml(params);

  void sendMail(params.employeeEmail, "Your leave request was rejected", html).catch(
    (err: unknown) => console.error("Mail error:", err),
  );
}

function startOfUtcDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function endOfUtcDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(23, 59, 59, 999);
  return copy;
}

function getUtcDaysBetween(startDate: Date, endDate: Date): Date[] {
  const start = startOfUtcDay(startDate);
  const end = startOfUtcDay(endDate);
  const days: Date[] = [];

  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor = new Date(cursor.getTime() + 86_400_000)
  ) {
    days.push(new Date(cursor));
  }

  return days;
}

function leaveCoversDay(
  leave: { startDate: Date; endDate: Date },
  day: Date,
): boolean {
  const dayStart = startOfUtcDay(day);
  const dayEnd = endOfUtcDay(day);
  return leave.startDate <= dayEnd && leave.endDate >= dayStart;
}

async function buildLeaveCapacityWarning(
  workspaceId: string,
  teamId: string,
  startDate: Date,
  endDate: Date,
  options?: {
    excludeLeaveId?: string | undefined;
    includeCurrentLeaveInProjection?: boolean | undefined;
  },
): Promise<LeaveCapacityWarning> {
  const [team, teamSize, overlappingLeaves] = await Promise.all([
    prisma.team.findFirst({
      where: { id: teamId, workspaceId },
      select: { name: true },
    }),
    prisma.user.count({
      where: { workspaceId, teamId, isActive: true },
    }),
    prisma.leaveRequest.findMany({
      where: {
        teamId,
        status: { notIn: ["CANCELLED", "REJECTED"] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        ...(options?.excludeLeaveId
          ? { id: { not: options.excludeLeaveId } }
          : {}),
      },
      select: {
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  const allDays = getUtcDaysBetween(startDate, endDate);
  const includeCurrentLeave = options?.includeCurrentLeaveInProjection ?? false;

  let projectedOffCount = includeCurrentLeave ? 1 : 0;

  for (const day of allDays) {
    const offCountForDay =
      overlappingLeaves.filter((leave) => leaveCoversDay(leave, day)).length +
      (includeCurrentLeave ? 1 : 0);

    if (offCountForDay > projectedOffCount) {
      projectedOffCount = offCountForDay;
    }
  }

  projectedOffCount = Math.min(projectedOffCount, teamSize);
  const projectedAvailableCount = Math.max(teamSize - projectedOffCount, 0);
  const projectedCapacityPercent =
    teamSize > 0 ? Math.round((projectedAvailableCount / teamSize) * 100) : 0;

  const shouldWarn =
    projectedCapacityPercent <= TEAM_MIN_CAPACITY_WARNING_PERCENT;
  const teamName = team?.name ?? "Team";

  return {
    teamId,
    teamName,
    teamSize,
    projectedOffCount,
    projectedAvailableCount,
    projectedCapacityPercent,
    shouldWarn,
    message: `⚠ ${teamName} team capacity will drop to ${projectedCapacityPercent}% (${projectedAvailableCount}/${teamSize} available).`,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export const applyLeave = async (
  input: ApplyLeaveInput,
  userId: string,
  workspaceId: string,
  teamId: string | null,
) => {
  // ── Guard: user must belong to a team ───────────────────────────────────────
  if (!teamId) {
    throw new BadRequestError(
      "You must be assigned to a team to apply for leave",
    );
  }

  // ── Rule 1: Workspace isolation ─────────────────────────────────────────────
  // Verify the user record still exists, is active, and belongs to the same
  // workspace as the JWT claims. Prevents tampered tokens from acting across
  // workspace boundaries.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new UnauthorizedError("User not found or inactive");
  }
  if (user.workspaceId !== workspaceId) {
    throw new ForbiddenError("Cross-workspace action not allowed");
  }

  const leaveTypeEnabled = await isLeaveTypeEnabledForWorkspace(
    workspaceId,
    input.type,
  );
  if (!leaveTypeEnabled) {
    throw new BadRequestError("Selected leave type is currently disabled");
  }

  // ── Rule 2: Date and session validity ───────────────────────────────────────
  const startDate = new Date(input.start_date);
  const endDate = new Date(input.end_date);
  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(0, 0, 0, 0);

  if (endDate < startDate) {
    throw new BadRequestError("End date cannot be before start date");
  }

  // Same-day edge case: afternoon start with morning end is impossible
  if (
    startDate.getTime() === endDate.getTime() &&
    input.start_session === "SECOND_HALF" &&
    input.end_session === "FIRST_HALF"
  ) {
    throw new BadRequestError(
      "End session cannot be before start session on the same day",
    );
  }

  const newStartSlot = toStartSlot(startDate, input.start_session);
  const newEndSlot = toEndSlot(endDate, input.end_session);

  // ── Rule 3: No overlapping leaves (date + session level) ────────────────────
  // First narrow candidates with a fast DB date-range filter, then do precise
  // half-day slot comparison in memory.
  const candidateLeaves = await prisma.leaveRequest.findMany({
    where: {
      userId,
      status: { notIn: ["CANCELLED", "REJECTED"] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });

  for (const existing of candidateLeaves) {
    const exStart = toStartSlot(
      existing.startDate,
      existing.startSession as SessionValue,
    );
    const exEnd = toEndSlot(
      existing.endDate,
      existing.endSession as SessionValue,
    );

    if (newStartSlot <= exEnd && newEndSlot >= exStart) {
      throw new ConflictError(
        `You already have a ${existing.status.toLowerCase()} leave request that overlaps with this period`,
      );
    }
  }

  const capacityWarning = await buildLeaveCapacityWarning(
    workspaceId,
    teamId,
    startDate,
    endDate,
    { includeCurrentLeaveInProjection: true },
  );

  const conflictDetected = capacityWarning.shouldWarn;
  const warningMessage = conflictDetected ? capacityWarning.message : undefined;

  // ── Create leave request ────────────────────────────────────────────────────
  // approverId and comment are intentionally omitted — set only by an approver.
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId,
      teamId,
      startDate,
      startSession: input.start_session,
      endDate,
      endSession: input.end_session,
      type: input.type,
      reason: input.reason,
      status: "PENDING",
    },
  });

  const [requester, approvers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.user.findMany({
      where: {
        workspaceId,
        isActive: true,
        OR: [{ role: "MANAGER", teamId }, { role: "ADMIN" }],
      },
      select: { email: true, name: true },
    }),
  ]);

  for (const approver of approvers) {
    notifyLeaveSubmitted({
      managerEmail: approver.email,
      managerName: approver.name,
      employeeName: requester?.name ?? user.name,
      leaveType: input.type,
      startDate,
      endDate,
      note: input.reason,
    });
  }

  void sendLeaveNotification(workspaceId, {
    userName: requester?.name ?? user.name,
    leaveType: leaveRequest.type,
    startDate: leaveRequest.startDate.toDateString(),
    endDate: leaveRequest.endDate.toDateString(),
    startSession: leaveRequest.startSession,
    endSession: leaveRequest.endSession,
    ...(leaveRequest.reason ? { reason: leaveRequest.reason } : {}),
  }).catch((err: unknown) => console.error("Slack notification error:", err));

  return {
    leaveRequest,
    warning: conflictDetected,
    warningMessage,
    capacityWarning,
  };
};

// ── List leave requests ───────────────────────────────────────────────────────
// Builds a dynamic WHERE clause based on the caller's role, then runs a
// parallel count + paginated findMany so the client can render pagination UI.

export const listLeave = async (
  query: ListLeaveQuery,
  userId: string,
  workspaceId: string,
  role: string,
  callerTeamId: string | null,
) => {
  const { status, team_id, page, limit } = query;

  // ── Base: multi-tenant safety — always scope to caller's workspace ──────────
  // LeaveRequest has no direct workspaceId; we scope via the user relation.
  // This join is lightweight and guarantees cross-workspace data never leaks.
  const where: Prisma.LeaveRequestWhereInput = {
    user: { workspaceId },
  };

  // ── Role-based scoping ──────────────────────────────────────────────────────
  if (role === "USER") {
    // Employees see only their own requests; team_id param is ignored.
    where.userId = userId;
  } else if (role === "MANAGER") {
    // Managers see their own team; team_id param is silently ignored so a
    // manager can never peek at another team by passing a different team_id.
    if (!callerTeamId) {
      throw new BadRequestError(
        "Manager must be assigned to a team to view leave requests",
      );
    }
    where.teamId = callerTeamId;
  } else {
    // ADMIN — workspace-wide; optionally filter by team_id from query.
    if (team_id) {
      where.teamId = team_id;
    }
  }

  // ── Optional status filter ─────────────────────────────────────────────────
  if (status) {
    where.status = status;
  }

  // ── Pagination math ────────────────────────────────────────────────────────
  const skip = (page - 1) * limit;
  const take = limit;

  // ── Parallel DB calls ──────────────────────────────────────────────────────
  const [total, leaves] = await Promise.all([
    prisma.leaveRequest.count({ where }),
    prisma.leaveRequest.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true } },
      },
    }),
  ]);

  const shouldIncludeCapacityWarnings =
    status === "PENDING" && (role === "MANAGER" || role === "ADMIN");

  if (!shouldIncludeCapacityWarnings) {
    return { leaves, total, page, limit };
  }

  const leavesWithCapacityWarnings = await Promise.all(
    leaves.map(async (leave) => {
      const capacityWarning = await buildLeaveCapacityWarning(
        workspaceId,
        leave.teamId,
        leave.startDate,
        leave.endDate,
        {
          excludeLeaveId: leave.id,
          includeCurrentLeaveInProjection: leave.status === "PENDING",
        },
      );

      return {
        ...leave,
        capacityWarning: capacityWarning.shouldWarn ? capacityWarning : null,
      };
    }),
  );

  return { leaves: leavesWithCapacityWarnings, total, page, limit };
};

// ── Approve / Reject leave ────────────────────────────────────────────────────
// Only PENDING leaves can transition. Managers are locked to their own team.

export const updateLeaveStatus = async (
  leaveId: string,
  input: UpdateLeaveStatusInput,
  actorId: string,
  workspaceId: string,
  role: string,
  callerTeamId: string | null,
) => {
  // Fetch leave + user's workspaceId for isolation check in one query
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { user: { select: { workspaceId: true } } },
  });

  // 404 for not-found AND for cross-workspace requests (don't leak existence)
  if (!leave || leave.user.workspaceId !== workspaceId) {
    throw new NotFoundError("Leave request not found");
  }

  // ── State transition guard ─────────────────────────────────────────────────
  // Only PENDING → APPROVED/REJECTED is allowed.
  if (leave.status !== "PENDING") {
    throw new ConflictError("Leave request has already been processed");
  }

  // ── Manager scope guard ────────────────────────────────────────────────────
  // A manager can only action leave requests that belong to their own team.
  if (role === "MANAGER") {
    if (!callerTeamId || leave.teamId !== callerTeamId) {
      throw new ForbiddenError(
        "You can only manage leave requests for your own team",
      );
    }
  }

  // ── Persist update ─────────────────────────────────────────────────────────
  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: input.status,
      approverId: actorId,
      comment: input.comment ?? null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true } },
    },
  });

  if (updated.status === "APPROVED") {
    notifyLeaveApproved({
      employeeEmail: updated.user.email,
      employeeName: updated.user.name,
      leaveType: updated.type,
      startDate: updated.startDate,
      endDate: updated.endDate,
      approvedBy: updated.approver?.name ?? "Manager",
    });

    void sendLeaveStatusNotification(workspaceId, {
      userName: updated.user.name,
      leaveType: updated.type,
      status: "APPROVED",
      ...(updated.comment ? { comment: updated.comment } : {}),
      approverName: updated.approver?.name ?? "Manager",
    }).catch((err: unknown) => console.error("Slack notification error:", err));
  }

  if (updated.status === "REJECTED") {
    notifyLeaveRejected({
      employeeEmail: updated.user.email,
      employeeName: updated.user.name,
      leaveType: updated.type,
      startDate: updated.startDate,
      endDate: updated.endDate,
      rejectedBy: updated.approver?.name ?? "Manager",
      comment: updated.comment,
    });

    void sendLeaveStatusNotification(workspaceId, {
      userName: updated.user.name,
      leaveType: updated.type,
      status: "REJECTED",
      ...(updated.comment ? { comment: updated.comment } : {}),
      approverName: updated.approver?.name ?? "Manager",
    }).catch((err: unknown) => console.error("Slack notification error:", err));
  }

  return updated;
};

// ── Cancel leave ──────────────────────────────────────────────────────────────
// Only the owner can cancel, and only while the request is still PENDING.

export const cancelLeave = async (
  leaveId: string,
  userId: string,
  workspaceId: string,
) => {
  // Fetch with workspace isolation via user relation
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { user: { select: { workspaceId: true } } },
  });

  // 404 for not-found AND for cross-workspace (don't leak existence)
  if (!leave || leave.user.workspaceId !== workspaceId) {
    throw new NotFoundError("Leave request not found");
  }

  // ── Ownership guard ────────────────────────────────────────────────────────
  if (leave.userId !== userId) {
    throw new ForbiddenError("You can only cancel your own leave requests");
  }

  // ── State guard ────────────────────────────────────────────────────────────
  if (leave.status !== "PENDING") {
    throw new ConflictError("Only pending leave requests can be cancelled");
  }

  const cancelled = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: "CANCELLED" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true } },
    },
  });

  return cancelled;
};
