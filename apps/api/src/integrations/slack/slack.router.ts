import { Router } from "express";
import { prisma } from "../../lib/db.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import {
  disconnectSlack,
  exchangeCodeForTokens,
  getSlackInstallUrl,
  storeInstallation,
} from "./slack.oauth.js";
import { handleBlockAction, handleViewSubmission } from "./slack.actions.js";
import { handleSlashCommand } from "./slack.commands.js";
import { verifySlackSignature } from "./slack.middleware.js";
import { slackService } from "./slack.service.js";

export const slackRouter = Router();

slackRouter.get("/oauth/install", authenticate, authorize(["ADMIN"]), (req, res) => {
  const workspaceId = req.user?.workspaceId;
  if (!workspaceId) {
    res.status(400).json({ success: false, message: "Missing workspace context" });
    return;
  }

  res.redirect(getSlackInstallUrl(workspaceId));
});

slackRouter.get("/oauth/callback", async (req, res) => {
  const frontendUrl = process.env.CLIENT_URL ?? "http://localhost:3000";
  const code = String(req.query.code ?? "");
  const stateWorkspaceId = String(req.query.state ?? "");

  if (!code || !stateWorkspaceId) {
    res.redirect(`${frontendUrl}/settings?slack=error`);
    return;
  }

  try {
    const installation = await exchangeCodeForTokens(code);
    await storeInstallation(stateWorkspaceId, null, installation);
    res.redirect(`${frontendUrl}/settings?slack=connected`);
  } catch (error) {
    console.error("Slack OAuth callback failed", error);
    res.redirect(`${frontendUrl}/settings?slack=error`);
  }
});

slackRouter.get("/status", authenticate, authorize(["ADMIN"]), async (req, res) => {
  const workspaceId = req.user?.workspaceId;
  if (!workspaceId) {
    res.status(400).json({ success: false, message: "Missing workspace context" });
    return;
  }

  const status = await slackService.getStatus(workspaceId);
  res.json(status);
});

slackRouter.delete("/disconnect", authenticate, authorize(["ADMIN"]), async (req, res) => {
  const workspaceId = req.user?.workspaceId;
  if (!workspaceId) {
    res.status(400).json({ success: false, message: "Missing workspace context" });
    return;
  }

  await disconnectSlack(workspaceId);
  res.json({ success: true });
});

slackRouter.patch("/settings", authenticate, authorize(["ADMIN"]), async (req, res) => {
  const workspaceId = req.user?.workspaceId;
  if (!workspaceId) {
    res.status(400).json({ success: false, message: "Missing workspace context" });
    return;
  }

  const slackDigestEnabled = Boolean(req.body.slackDigestEnabled);
  const slackDigestTime = req.body.slackDigestTime ? String(req.body.slackDigestTime) : null;
  const slackDigestChannel = req.body.slackDigestChannel
    ? String(req.body.slackDigestChannel)
    : null;
  const slackNotifyLeave = req.body.slackNotifyLeave !== undefined
    ? Boolean(req.body.slackNotifyLeave)
    : true;

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      slackDigestEnabled,
      slackDigestTime,
      slackDigestChannel,
      slackNotifyLeave,
    },
  });

  res.json({ success: true });
});

slackRouter.post("/commands", verifySlackSignature, async (req, res) => {
  await handleSlashCommand(req, res);
});

slackRouter.post("/actions", verifySlackSignature, async (req, res) => {
  const payload = req.body.payload ? JSON.parse(String(req.body.payload)) : null;
  if (!payload) {
    res.status(400).json({ success: false, message: "Invalid Slack action payload" });
    return;
  }

  req.body = payload;

  if (payload.type === "view_submission") {
    await handleViewSubmission(req, res);
    return;
  }

  await handleBlockAction(req, res);
});
