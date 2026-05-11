import { Router } from "express";

import {
  getAnalyticsController,
  getSummaryController,
} from "../controllers/reports.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.get("/summary", authenticate, getSummaryController);
router.get(
  "/analytics",
  authenticate,
  authorize(["ADMIN", "MANAGER"]),
  getAnalyticsController,
);

export { router as reportsRoutes };
