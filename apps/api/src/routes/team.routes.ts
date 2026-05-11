import { Router } from "express";
import {
  createTeamController,
  deleteTeamController,
  listTeamsController,
  updateTeamController,
} from "../controllers/team.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createTeamSchema, updateTeamSchema } from "../utils/validations.js";

const router = Router();

router.get("/", authenticate, listTeamsController);
router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validate(createTeamSchema),
  createTeamController,
);
router.patch(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  validate(updateTeamSchema),
  updateTeamController,
);
router.delete("/:id", authenticate, authorize(["ADMIN"]), deleteTeamController);

export { router as teamRoutes };
