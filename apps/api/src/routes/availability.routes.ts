import { Router } from "express";

import {
  getAvailabilityBoardController,
  setMyAvailabilityController,
} from "../controllers/availability.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { setMyAvailabilitySchema } from "../utils/validations.js";

const router = Router();

router.get("/board", authenticate, getAvailabilityBoardController);
router.put(
  "/me",
  authenticate,
  validate(setMyAvailabilitySchema),
  setMyAvailabilityController,
);

export { router as availabilityRoutes };
