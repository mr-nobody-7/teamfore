import { Router } from "express";
import { slackRouter } from "../integrations/slack/slack.router.js";

const router = Router();

router.use("/", slackRouter);

export { router as slackRoutes };
