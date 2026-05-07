import {
  notifyAvailabilityUpdate,
  notifyLeaveApplied,
  notifyLeaveCancelled,
  notifyLeaveDecision,
} from "../integrations/slack/slack.notifications.js";

export async function sendLeaveNotification(
  workspaceId: string,
  data: {
    leaveId?: string;
    requesterId?: string;
    userName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    startSession: string;
    endSession: string;
    reason?: string;
  },
): Promise<void> {
  await notifyLeaveApplied({
    workspaceId,
    leaveId: data.leaveId ?? "",
    requesterId: data.requesterId ?? "",
    requesterName: data.userName,
    leaveType: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
    ...(data.reason ? { reason: data.reason } : {}),
  });
}

export async function sendLeaveStatusNotification(
  workspaceId: string,
  data: {
    requesterId?: string;
    userName: string;
    leaveType: string;
    status: "APPROVED" | "REJECTED";
    comment?: string;
    approverName: string;
  },
): Promise<void> {
  await notifyLeaveDecision({
    workspaceId,
    ...(data.requesterId ? { requesterId: data.requesterId } : {}),
    status: data.status,
    leaveType: data.leaveType,
    approverName: data.approverName,
    ...(data.comment ? { comment: data.comment } : {}),
  });
}

export async function sendLeaveCancelledNotification(
  workspaceId: string,
  data: {
    userName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
  },
): Promise<void> {
  await notifyLeaveCancelled({
    workspaceId,
    requesterName: data.userName,
    leaveType: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
  });
}

export async function sendAvailabilityNotification(
  workspaceId: string,
  data: {
    userName: string;
    status: string;
    date: string;
  },
): Promise<void> {
  await notifyAvailabilityUpdate({
    workspaceId,
    userName: data.userName,
    status: data.status,
    date: data.date,
  });
}
