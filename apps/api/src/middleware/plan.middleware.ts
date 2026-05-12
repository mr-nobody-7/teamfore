import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/db.js";

const PLAN_LEVELS = {
  FREE: 0,
  STARTER: 1,
  GROWTH: 2,
} as const;

type PlanName = keyof typeof PLAN_LEVELS;

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

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { plan: true },
      });

      const currentPlan = normalizePlan(workspace?.plan);
      if (PLAN_LEVELS[currentPlan] < PLAN_LEVELS[minPlan]) {
        res.status(403).json({
          success: false,
          message: "This feature requires the Starter plan.",
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
