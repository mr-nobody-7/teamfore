import { Router } from "express";
import passport from "passport";
import {
  calendarDisconnectController,
  calendarStatusController,
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
const GOOGLE_OAUTH_SCOPES = [
  "profile",
  "email",
  "https://www.googleapis.com/auth/calendar",
];

const GOOGLE_OAUTH_OPTIONS = {
  scope: GOOGLE_OAUTH_SCOPES,
  accessType: "offline" as const,
  prompt: "consent" as const,
  session: false,
};

router.post("/register", validate(registerSchema), registerController);
router.post(
  "/register-workspace",
  validate(registerWorkspaceSchema),
  registerWorkspaceController,
);
router.post("/login", validate(loginSchema), loginController);
router.get(
  "/google",
  passport.authenticate("google", GOOGLE_OAUTH_OPTIONS),
);
router.get(
  "/google/calendar-connect",
  passport.authenticate("google", {
    ...GOOGLE_OAUTH_OPTIONS,
    state: "calendar_connect",
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
router.get("/calendar-status", authenticate, calendarStatusController);
router.post(
  "/google/calendar-disconnect",
  authenticate,
  calendarDisconnectController,
);
router.get("/me", authenticate, meController);
router.post("/logout", logoutController);

export { router as authRoutes };
