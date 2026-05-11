import { Router } from "express";
import { createFeedbackController } from "../controllers/feedback.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createFeedbackSchema } from "../utils/validations.js";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createFeedbackSchema),
  createFeedbackController,
);

export { router as feedbackRoutes };
