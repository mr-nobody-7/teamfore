import type { Request, Response } from "express";
import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  removeSubscription,
  saveSubscription,
} from "../services/push.service.js";

const router = Router();

// GET /push/vapid-public-key — public endpoint; frontend fetches before login
router.get("/vapid-public-key", (_req: Request, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? "" });
});

// POST /push/subscribe — save a push subscription for the authenticated user
router.post(
  "/subscribe",
  authenticate,
  async (req: Request, res: Response) => {
    const { endpoint, keys } = req.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
    const userAgent = req.headers["user-agent"];

    await saveSubscription(req.user!.userId, {
      endpoint,
      keys,
      ...(userAgent !== undefined ? { userAgent } : {}),
    });
    res.json({ success: true });
  },
);

// DELETE /push/subscribe — remove a push subscription
router.delete(
  "/subscribe",
  authenticate,
  async (req: Request, res: Response) => {
    const { endpoint } = req.body as { endpoint: string };
    await removeSubscription(req.user!.userId, endpoint);
    res.json({ success: true });
  },
);

export { router as pushRoutes };
