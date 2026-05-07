import { prisma } from "../../lib/db.js";
import { buildLeaveAppliedBlocks } from "./slack.blocks.js";
import { slackService } from "./slack.service.js";

function toDateLabel(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export async function notifyLeaveApplied(params: {
  workspaceId: string;
  leaveId: string;
  requesterId: string;
  requesterName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
    select: { slackNotifyLeave: true },
  });

  if (!workspace?.slackNotifyLeave) {
    return;
  }

  const blocks = buildLeaveAppliedBlocks({
    leaveId: params.leaveId,
    requesterId: params.requesterId,
    requesterName: params.requesterName,
    leaveType: params.leaveType,
    startDate: toDateLabel(params.startDate),
    endDate: toDateLabel(params.endDate),
    ...(params.reason ? { reason: params.reason } : {}),
  });

  await slackService.sendToDefaultChannel(
    params.workspaceId,
    `${params.requesterName} submitted ${params.leaveType} leave`,
    blocks,
  );
}

export async function notifyLeaveDecision(params: {
  workspaceId: string;
  requesterId?: string;
  status: "APPROVED" | "REJECTED";
  leaveType: string;
  approverName: string;
  comment?: string;
}): Promise<void> {
  if (!params.requesterId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: params.requesterId },
    select: { slackDmChannel: true },
  });

  if (!user?.slackDmChannel) {
    return;
  }

  const action = params.status === "APPROVED" ? "approved" : "rejected";
  const maybeComment = params.comment ? `\nReason: ${params.comment}` : "";

  await slackService.sendMessage(params.workspaceId, {
    channel: user.slackDmChannel,
    text: `Your ${params.leaveType} leave was ${action} by ${params.approverName}.${maybeComment}`,
  });
}

export async function notifyLeaveCancelled(params: {
  workspaceId: string;
  requesterName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
}): Promise<void> {
  await slackService.sendToDefaultChannel(
    params.workspaceId,
    `${params.requesterName} cancelled ${params.leaveType} leave (${toDateLabel(params.startDate)} to ${toDateLabel(params.endDate)}).`,
  );
}

export async function notifyAvailabilityUpdate(params: {
  workspaceId: string;
  userName: string;
  status: string;
  date: string;
}): Promise<void> {
  await slackService.sendToDefaultChannel(
    params.workspaceId,
    `${params.userName} is ${params.status.replaceAll("_", " ")} on ${new Date(params.date).toISOString().slice(0, 10)}.`,
  );
}
