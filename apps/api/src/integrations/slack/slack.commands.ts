import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import type { ApplyLeaveInput } from "../../types/index.js";
import { applyLeave } from "../../services/leave.service.js";
import { slackService } from "./slack.service.js";
import type { Prisma } from "../../generated/prisma/client.js";

function commandResponse(res: Response, text: string) {
  res.status(200).json({ response_type: "ephemeral", text });
}

export async function handleSlackCommand(req: Request, res: Response): Promise<void> {
  const command = String(req.body.command ?? "");

  if (!command) {
    commandResponse(res, "Invalid Slack command payload.");
    return;
  }

  if (command === "/leave-status") {
    await handleLeaveStatus(req, res);
    return;
  }

  if (command === "/who-is-off") {
    await handleWhoIsOff(req, res);
    return;
  }

  if (command === "/apply-leave") {
    await handleApplyLeave(req, res);
    return;
  }

  if (command === "/availability") {
    commandResponse(res, "Availability commands are coming soon.");
    return;
  }

  commandResponse(res, "Unknown command.");
}

async function resolveSlackCaller(req: Request) {
  const teamId = String(req.body.team_id ?? "");
  const userId = String(req.body.user_id ?? "");

  const workspaceId = await slackService.findWorkspaceByTeamId(teamId);
  if (!workspaceId) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      workspaceId,
      slackUserId: userId,
    },
    select: {
      id: true,
      workspaceId: true,
      teamId: true,
      role: true,
      slackUserId: true,
      slackDmChannel: true,
      name: true,
    },
  });

  if (!user) {
    return null;
  }

  if (!user.slackUserId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { slackUserId: userId },
    });
  }

  return user;
}

async function handleLeaveStatus(req: Request, res: Response): Promise<void> {
  const caller = await resolveSlackCaller(req);
  if (!caller) {
    commandResponse(res, "Please connect your Slack user to TeamFore first.");
    return;
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const requests = await prisma.leaveRequest.findMany({
    where: {
      userId: caller.id,
      startDate: { gte: monthStart, lt: monthEnd },
    },
    orderBy: { startDate: "asc" },
    select: {
      type: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  if (requests.length === 0) {
    commandResponse(res, "You have no leave requests this month.");
    return;
  }

  const lines = requests.map((item) => {
    const s = item.startDate.toISOString().slice(0, 10);
    const e = item.endDate.toISOString().slice(0, 10);
    return `• ${item.type}: ${item.status} (${s} to ${e})`;
  });

  commandResponse(res, `Your leave requests this month:\n${lines.join("\n")}`);
}

async function handleWhoIsOff(req: Request, res: Response): Promise<void> {
  const caller = await resolveSlackCaller(req);
  if (!caller) {
    commandResponse(res, "Please connect your Slack user to TeamFore first.");
    return;
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const where: Prisma.LeaveRequestWhereInput = {
    status: "APPROVED",
    startDate: { lt: tomorrow },
    endDate: { gte: today },
    user: { workspaceId: caller.workspaceId },
    ...(caller.teamId ? { teamId: caller.teamId } : {}),
  };

  const leaves = await prisma.leaveRequest.findMany({
    where,
    select: {
      type: true,
      user: { select: { name: true } },
    },
  });

  if (leaves.length === 0) {
    commandResponse(res, "No one is on leave today.");
    return;
  }

  const lines = leaves.map((item) => `• ${item.user.name} (${item.type})`);
  commandResponse(res, `Team members off today:\n${lines.join("\n")}`);
}

async function handleApplyLeave(req: Request, res: Response): Promise<void> {
  const caller = await resolveSlackCaller(req);
  if (!caller) {
    commandResponse(res, "Please connect your Slack user to TeamFore first.");
    return;
  }

  if (!caller.teamId) {
    commandResponse(res, "You must belong to a team before applying leave.");
    return;
  }

  const text = String(req.body.text ?? "").trim();
  const [dateText, leaveType] = text.split(" ");

  if (!dateText || !leaveType) {
    commandResponse(res, "Usage: /apply-leave YYYY-MM-DD LEAVE_TYPE");
    return;
  }

  const input: ApplyLeaveInput = {
    start_date: dateText,
    end_date: dateText,
    start_session: "FULL_DAY",
    end_session: "FULL_DAY",
    type: leaveType,
    reason: "Applied via Slack",
  };

  try {
    await applyLeave(input, caller.id, caller.workspaceId, caller.teamId);
    commandResponse(res, `Leave request submitted for ${dateText} (${leaveType}).`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply leave.";
    commandResponse(res, `Failed to submit leave: ${message}`);
  }
}
