import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import { applyLeave, updateLeaveStatus } from "../../services/leave.service.js";
import type { ApplyLeaveInput } from "../../types/index.js";
import { slackService } from "./slack.service.js";

interface SlackViewSubmissionPayload {
  type: "view_submission";
  user: { id: string };
  view: {
    callback_id: string;
    private_metadata?: string;
    state: {
      values: Record<string, Record<string, Record<string, unknown>>>;
    };
  };
}

async function findManagerBySlack(req: Request) {
  const teamId = String(req.body.team?.id ?? "");
  const slackUserId = String(req.body.user?.id ?? "");

  const installation = await prisma.slackInstallation.findFirst({
    where: { teamId },
    select: { workspaceId: true },
  });

  if (!installation) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      workspaceId: installation.workspaceId,
      slackUserId,
      role: { in: ["MANAGER", "ADMIN"] },
    },
    select: {
      id: true,
      workspaceId: true,
      teamId: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return user;
}

export async function handleSlackActions(req: Request, res: Response): Promise<void> {
  const action = req.body.actions?.[0];

  if (!action) {
    res.status(200).send();
    return;
  }

  const manager = await findManagerBySlack(req);
  if (!manager) {
    res.status(200).json({ text: "Only managers/admins can perform this action." });
    return;
  }

  if (action.action_id === "leave_approve") {
    const leaveId = String(action.value);
    await updateLeaveStatus(
      leaveId,
      { status: "APPROVED" },
      manager.id,
      manager.workspaceId,
      manager.role,
      manager.teamId,
    );
    res.status(200).json({ text: "Leave request approved." });
    return;
  }

  if (action.action_id === "leave_reject") {
    const leaveId = String(action.value);
    await updateLeaveStatus(
      leaveId,
      { status: "REJECTED", comment: "Rejected from Slack" },
      manager.id,
      manager.workspaceId,
      manager.role,
      manager.teamId,
    );
    res.status(200).json({ text: "Leave request rejected." });
    return;
  }

  res.status(200).send();
}

export async function handleBlockAction(req: Request, res: Response): Promise<void> {
  await handleSlackActions(req, res);
}

async function sendDmToSlackUser(
  workspaceId: string,
  slackUserId: string,
  text: string,
): Promise<void> {
  const client = await slackService.getClient(workspaceId);
  if (!client) {
    return;
  }

  const dm = await client.conversations.open({ users: slackUserId });
  const channelId = dm.channel?.id;

  if (!channelId) {
    return;
  }

  await client.chat.postMessage({
    channel: channelId,
    text,
  });
}

function readString(
  values: SlackViewSubmissionPayload["view"]["state"]["values"],
  blockId: string,
  actionId: string,
  key: "value" | "selected_date",
): string | null {
  const action = values[blockId]?.[actionId];
  const raw = action?.[key];
  if (typeof raw !== "string") {
    return null;
  }
  return raw;
}

function readSelectedOptionValue(
  values: SlackViewSubmissionPayload["view"]["state"]["values"],
  blockId: string,
  actionId: string,
): string | null {
  const action = values[blockId]?.[actionId];
  const selected = action?.selected_option;
  if (
    typeof selected !== "object" ||
    selected === null ||
    !("value" in selected) ||
    typeof selected.value !== "string"
  ) {
    return null;
  }
  return selected.value;
}

async function handleApplyLeaveSubmission(
  payload: SlackViewSubmissionPayload,
): Promise<void> {
  let workspaceId = "";
  let slackUserId = payload.user.id;

  try {
    const parsed = JSON.parse(payload.view.private_metadata ?? "{}");
    workspaceId = typeof parsed.workspaceId === "string" ? parsed.workspaceId : "";
    slackUserId = typeof parsed.slackUserId === "string" ? parsed.slackUserId : slackUserId;
  } catch {
    // keep defaults; handled by validation below
  }

  if (!workspaceId || !slackUserId) {
    return;
  }

  const values = payload.view.state.values;

  const leaveTypeId = readSelectedOptionValue(
    values,
    "leave_type_block",
    "leave_type_select",
  );
  const startDateText = readString(
    values,
    "start_date_block",
    "start_date_picker",
    "selected_date",
  );
  const endDateText = readString(
    values,
    "end_date_block",
    "end_date_picker",
    "selected_date",
  );
  const session = readSelectedOptionValue(values, "session_block", "session_select");
  const reason = readString(values, "reason_block", "reason_input", "value");

  if (!leaveTypeId || !startDateText || !endDateText || !session) {
    await sendDmToSlackUser(
      workspaceId,
      slackUserId,
      "Unable to read your leave request form. Please try again.",
    );
    return;
  }

  const user = await prisma.user.findFirst({
    where: { workspaceId, slackUserId },
    select: { id: true, teamId: true },
  });

  if (!user) {
    await sendDmToSlackUser(
      workspaceId,
      slackUserId,
      "I couldn't find your TeamFore account. Sign up at teamfore.com first.",
    );
    return;
  }

  const startDate = new Date(`${startDateText}T00:00:00`);
  const endDate = new Date(`${endDateText}T00:00:00`);

  const leaveType = await prisma.workspaceLeaveType.findFirst({
    where: { id: leaveTypeId, workspaceId },
    select: { type: true, label: true },
  });

  if (!leaveType) {
    await sendDmToSlackUser(
      workspaceId,
      slackUserId,
      "The selected leave type is invalid. Please try again.",
    );
    return;
  }

  const input: ApplyLeaveInput = {
    start_date: startDate.toISOString().slice(0, 10),
    end_date: endDate.toISOString().slice(0, 10),
    start_session: session as ApplyLeaveInput["start_session"],
    end_session: session as ApplyLeaveInput["end_session"],
    type: leaveType.type,
    reason: reason ?? "",
  };

  try {
    await applyLeave(input, user.id, workspaceId, user.teamId ?? null);

    const start = startDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const end = endDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    await sendDmToSlackUser(
      workspaceId,
      slackUserId,
      `✅ *Leave request submitted!*\nYour ${leaveType.label} request for ${start} – ${end} has been submitted for approval.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit leave request";
    await sendDmToSlackUser(workspaceId, slackUserId, message);
  }
}

export async function handleViewSubmission(req: Request, res: Response): Promise<void> {
  const payload = req.body as SlackViewSubmissionPayload;

  // Slack expects a fast ack to close the modal.
  res.status(200).json({});

  if (payload.type !== "view_submission") {
    return;
  }

  if (payload.view.callback_id !== "apply_leave_modal") {
    return;
  }

  void handleApplyLeaveSubmission(payload).catch((error) => {
    console.error("[slack:view_submission] apply_leave_modal failed:", error);
  });
}
