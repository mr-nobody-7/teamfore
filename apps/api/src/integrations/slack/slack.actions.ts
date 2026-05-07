import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import { updateLeaveStatus } from "../../services/leave.service.js";

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
