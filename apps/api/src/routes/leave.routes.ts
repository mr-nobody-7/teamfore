import { Router } from "express";
import {
  applyLeaveController,
  cancelLeaveController,
  listLeaveController,
  updateLeaveStatusController,
} from "../controllers/leave.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  applyLeaveSchema,
  updateLeaveStatusSchema,
} from "../utils/validations.js";

const router = Router();

router.post(
  "/applyLeave",
  authenticate,
  authorize(["ADMIN", "MANAGER", "USER"]),
  validate(applyLeaveSchema),
  applyLeaveController,
);

router.get("/", authenticate, listLeaveController);

router.patch(
  "/:id/status",
  authenticate,
  authorize(["ADMIN", "MANAGER"]),
  validate(updateLeaveStatusSchema),
  updateLeaveStatusController,
);

router.patch("/:id/cancel", authenticate, cancelLeaveController);

export { router as leaveRoutes };
