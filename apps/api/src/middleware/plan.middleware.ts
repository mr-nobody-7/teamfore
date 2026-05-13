import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/db.js";

const PLAN_LEVELS = {
  FREE: 0,
  STARTER: 1,
  GROWTH: 2,
} as const;

type PlanName = keyof typeof PLAN_LEVELS;

const PLAN_CACHE_TTL_MS = 60_000;
const workspacePlanCache = new Map<
  string,
  { plan: PlanName; expiresAt: number }
>();

function normalizePlan(plan: string | null | undefined): PlanName {
  if (plan === "STARTER" || plan === "GROWTH") {
    return plan;
  }

  return "FREE";
}

export function requirePlan(minPlan: PlanName) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.user?.workspaceId;
      if (!workspaceId) {
        res.status(403).json({
          success: false,
          message: "This feature requires the Starter plan.",
          upgradeRequired: true,
          requiredPlan: minPlan,
        });
        return;
      }

      const cachedPlan = workspacePlanCache.get(workspaceId);
      const now = Date.now();

      let currentPlan: PlanName;
      if (cachedPlan && cachedPlan.expiresAt > now) {
        currentPlan = cachedPlan.plan;
      } else {
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { plan: true },
        });

        currentPlan = normalizePlan(workspace?.plan);
        workspacePlanCache.set(workspaceId, {
          plan: currentPlan,
          expiresAt: now + PLAN_CACHE_TTL_MS,
        });
      }

      if (PLAN_LEVELS[currentPlan] < PLAN_LEVELS[minPlan]) {
        res.status(403).json({
          success: false,
          message: `This feature requires the ${minPlan} plan.`,
          upgradeRequired: true,
          requiredPlan: minPlan,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
