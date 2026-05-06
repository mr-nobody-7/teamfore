import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/db.js";
import {
  disconnectSlack,
  getSlackOAuthUrl,
  handleSlackOAuthCallback,
} from "../services/slack.service.js";
import { BadRequestError } from "../utils/errors.js";

export const connectSlack = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      throw new BadRequestError("Missing workspace context");
    }

    const url = getSlackOAuthUrl(workspaceId);
    res.redirect(url);
  } catch (error) {
    next(error);
  }
};

export const slackOAuthCallback = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

  try {
    const code = String(req.query.code ?? "");
    const workspaceId = String(req.query.state ?? "");

    if (!code || !workspaceId) {
      res.status(400).json({ success: false, message: "Missing code or state" });
      return;
    }

    await handleSlackOAuthCallback(code, workspaceId);
    res.redirect(`${frontendUrl}/settings/integrations?slack=connected`);
  } catch {
    res.redirect(`${frontendUrl}/settings/integrations?slack=error`);
  }
};

export const slackDisconnect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      throw new BadRequestError("Missing workspace context");
    }

    await disconnectSlack(workspaceId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const slackStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      throw new BadRequestError("Missing workspace context");
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        slackTeamName: true,
        slackChannelId: true,
        slackConnectedAt: true,
      },
    });

    res.json({
      connected: Boolean(workspace?.slackConnectedAt),
      teamName: workspace?.slackTeamName ?? null,
      channelId: workspace?.slackChannelId ?? null,
      connectedAt: workspace?.slackConnectedAt ?? null,
    });
  } catch (error) {
    next(error);
  }
};

export const setSlackChannel = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      throw new BadRequestError("Missing workspace context");
    }

    const channelId = String(req.body.channelId ?? "").trim();
    if (!channelId) {
      throw new BadRequestError("channelId required");
    }

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { slackChannelId: channelId },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
