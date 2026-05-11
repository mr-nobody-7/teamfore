import { Router } from "express";
import passport from "passport";
import {
  googleCallbackController,
  googleFailureController,
  loginController,
  logoutController,
  meController,
  registerController,
  registerWorkspaceController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  loginSchema,
  registerSchema,
  registerWorkspaceSchema,
} from "../utils/validations.js";

const router = Router();

router.post("/register", validate(registerSchema), registerController);
router.post(
  "/register-workspace",
  validate(registerWorkspaceSchema),
  registerWorkspaceController,
);
router.post("/login", validate(loginSchema), loginController);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/google/failure",
  }),
  googleCallbackController,
);
router.get("/google/failure", googleFailureController);
router.get("/me", authenticate, meController);
router.post("/logout", logoutController);

export { router as authRoutes };
