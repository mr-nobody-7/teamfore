import { Router } from "express";

import {
  createLeaveTypeController,
  deleteLeaveTypeController,
  getLeaveTypesSettingsController,
  listSupportedCountriesController,
  updateWorkspaceRegionalSettingsController,
  updateLeaveTypeController,
  updateLeaveTypesSettingsController,
} from "../controllers/settings.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  createLeaveTypeSchema,
  updateWorkspaceRegionalSettingsSchema,
  updateLeaveTypeSchema,
  updateLeaveTypesSchema,
} from "../utils/validations.js";

const router = Router();

router.get("/leave-types", authenticate, getLeaveTypesSettingsController);
router.put(
  "/leave-types",
  authenticate,
  authorize(["ADMIN"]),
  validate(updateLeaveTypesSchema),
  updateLeaveTypesSettingsController,
);
router.post(
  "/leave-types",
  authenticate,
  authorize(["ADMIN"]),
  validate(createLeaveTypeSchema),
  createLeaveTypeController,
);
router.patch(
  "/leave-types/:id",
  authenticate,
  authorize(["ADMIN"]),
  validate(updateLeaveTypeSchema),
  updateLeaveTypeController,
);
router.delete(
  "/leave-types/:id",
  authenticate,
  authorize(["ADMIN"]),
  deleteLeaveTypeController,
);
router.get(
  "/countries",
  authenticate,
  authorize(["ADMIN"]),
  listSupportedCountriesController,
);
router.post(
  "/workspace",
  authenticate,
  authorize(["ADMIN"]),
  validate(updateWorkspaceRegionalSettingsSchema),
  updateWorkspaceRegionalSettingsController,
);

export { router as settingsRoutes };
