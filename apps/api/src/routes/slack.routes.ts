import { Router } from "express";
import {
  connectSlack,
  setSlackChannel,
  slackDisconnect,
  slackOAuthCallback,
  slackStatus,
} from "../controllers/slack.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

// Public callback endpoint used by Slack after OAuth consent.
router.get("/oauth/callback", slackOAuthCallback);

// Protected endpoints (admin-managed integration settings).
router.get("/connect", authenticate, authorize(["ADMIN"]), connectSlack);
router.get("/status", authenticate, authorize(["ADMIN"]), slackStatus);
router.delete(
  "/disconnect",
  authenticate,
  authorize(["ADMIN"]),
  slackDisconnect,
);
router.patch("/channel", authenticate, authorize(["ADMIN"]), setSlackChannel);

export { router as slackRoutes };
