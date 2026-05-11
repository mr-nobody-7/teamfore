import { Router } from "express";

import {
  createUserController,
  deactivateUserController,
  listUsersController,
  updateMyPasswordController,
  updateMyProfileController,
  updateUserController,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  createUserSchema,
  updateMyPasswordSchema,
  updateMyProfileSchema,
  updateUserSchema,
} from "../utils/validations.js";

const router = Router();

router.put(
  "/me",
  authenticate,
  validate(updateMyProfileSchema),
  updateMyProfileController,
);
router.put(
  "/me/password",
  authenticate,
  validate(updateMyPasswordSchema),
  updateMyPasswordController,
);

router.get("/", authenticate, authorize(["ADMIN"]), listUsersController);
router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validate(createUserSchema),
  createUserController,
);
router.patch(
  "/:id",
  authenticate,
  authorize(["ADMIN"]),
  validate(updateUserSchema),
  updateUserController,
);
router.patch(
  "/:id/deactivate",
  authenticate,
  authorize(["ADMIN"]),
  deactivateUserController,
);

export { router as userRoutes };
