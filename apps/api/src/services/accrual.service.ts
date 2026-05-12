import cron from "node-cron";
import { prisma } from "../lib/db.js";
import type { WorkspaceLeavePolicy } from "../generated/prisma/client.js";

type AccrualPolicy = Pick<
  WorkspaceLeavePolicy,
  "accrualFrequency" | "daysPerYear"
>;

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function shouldAccrueThisMonth(policy: AccrualPolicy, month: number): boolean {
  if (policy.accrualFrequency === "MONTHLY") {
    return true;
  }

  if (policy.accrualFrequency === "QUARTERLY") {
    return [0, 3, 6, 9].includes(month);
  }

  return month === 0;
}

export function calculateMonthlyAccrual(policy: AccrualPolicy): number {
  if (policy.accrualFrequency === "MONTHLY") {
    return roundToTwoDecimals(policy.daysPerYear / 12);
  }

  if (policy.accrualFrequency === "QUARTERLY") {
    return roundToTwoDecimals(policy.daysPerYear / 4);
  }

  return roundToTwoDecimals(policy.daysPerYear);
}

export function getProRataFactor(userCreatedAt: Date, year: number): number {
  const joinYear = userCreatedAt.getUTCFullYear();
  if (joinYear < year) {
    return 1;
  }

  if (joinYear > year) {
    return 0;
  }

  const joinedMonth = userCreatedAt.getUTCMonth();
  const monthsRemaining = 12 - joinedMonth;
  return roundToTwoDecimals(monthsRemaining / 12);
}

export async function runMonthlyAccrual(): Promise<void> {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const policies = await prisma.workspaceLeavePolicy.findMany({
      where: { isActive: true },
      include: {
        workspace: { select: { id: true } },
        leaveType: { select: { isActive: true } },
      },
    });

    const processedUserIds = new Set<string>();
    let processedPolicyCount = 0;

    for (const policy of policies) {
      if (!policy.leaveType.isActive) {
        continue;
      }

      if (!shouldAccrueThisMonth(policy, currentMonth)) {
        continue;
      }

      processedPolicyCount += 1;

      const users = await prisma.user.findMany({
        where: {
          workspaceId: policy.workspaceId,
          isActive: true,
        },
        select: {
          id: true,
          createdAt: true,
        },
      });

      const monthlyAccrual = calculateMonthlyAccrual(policy);

      for (const user of users) {
        processedUserIds.add(user.id);
        const proRata = getProRataFactor(user.createdAt, currentYear);
        const accrualAmount = roundToTwoDecimals(monthlyAccrual * proRata);

        await prisma.userLeaveBalance.upsert({
          where: {
            userId_leaveTypeId_year: {
              userId: user.id,
              leaveTypeId: policy.leaveTypeId,
              year: currentYear,
            },
          },
          create: {
            userId: user.id,
            workspaceId: policy.workspaceId,
            leaveTypeId: policy.leaveTypeId,
            year: currentYear,
            openingBalance: 0,
            accrued: accrualAmount,
            taken: 0,
            carriedForward: 0,
          },
          update: {
            accrued: { increment: accrualAmount },
          },
        });
      }
    }

    console.log(
      `Accrual run complete: ${processedUserIds.size} users, ${processedPolicyCount} policies, month ${currentMonth}`,
    );
  } catch (error) {
    console.error("[runMonthlyAccrual] Failed to run monthly accrual", error);
  }
}

export async function runCarryForward(): Promise<void> {
  try {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    const balances = await prisma.userLeaveBalance.findMany({
      where: { year: prevYear },
      select: {
        userId: true,
        workspaceId: true,
        leaveTypeId: true,
        openingBalance: true,
        accrued: true,
        carriedForward: true,
        taken: true,
      },
    });

    for (const balance of balances) {
      const policy = await prisma.workspaceLeavePolicy.findFirst({
        where: { leaveTypeId: balance.leaveTypeId },
        select: { maxCarryForward: true },
      });

      if (!policy || policy.maxCarryForward === 0) {
        continue;
      }

      const unused =
        balance.openingBalance + balance.accrued + balance.carriedForward - balance.taken;

      if (unused <= 0) {
        continue;
      }

      const carryAmount = Math.min(unused, policy.maxCarryForward);

      await prisma.userLeaveBalance.upsert({
        where: {
          userId_leaveTypeId_year: {
            userId: balance.userId,
            leaveTypeId: balance.leaveTypeId,
            year: currentYear,
          },
        },
        create: {
          userId: balance.userId,
          workspaceId: balance.workspaceId,
          leaveTypeId: balance.leaveTypeId,
          year: currentYear,
          openingBalance: carryAmount,
          accrued: 0,
          taken: 0,
          carriedForward: carryAmount,
        },
        update: {
          openingBalance: carryAmount,
          carriedForward: carryAmount,
        },
      });
    }

    console.log(
      `Carry forward run complete: processed ${balances.length} balance records for year ${currentYear}`,
    );
  } catch (error) {
    console.error("[runCarryForward] Failed to run carry forward", error);
  }
}

export async function initializeUserBalances(
  userId: string,
  workspaceId: string,
): Promise<void> {
  try {
    const [user, policies] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
      prisma.workspaceLeavePolicy.findMany({
        where: {
          workspaceId,
          isActive: true,
          leaveType: { isActive: true },
        },
        select: {
          leaveTypeId: true,
          accrualFrequency: true,
          daysPerYear: true,
        },
      }),
    ]);

    if (!user) {
      return;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const proRata = getProRataFactor(user.createdAt, currentYear);

    for (const policy of policies) {
      const immediateAccrual = shouldAccrueThisMonth(policy, currentMonth)
        ? roundToTwoDecimals(calculateMonthlyAccrual(policy) * proRata)
        : 0;

      await prisma.userLeaveBalance.upsert({
        where: {
          userId_leaveTypeId_year: {
            userId,
            leaveTypeId: policy.leaveTypeId,
            year: currentYear,
          },
        },
        create: {
          userId,
          workspaceId,
          leaveTypeId: policy.leaveTypeId,
          year: currentYear,
          openingBalance: 0,
          accrued: immediateAccrual,
          taken: 0,
          carriedForward: 0,
        },
        update: {
          workspaceId,
        },
      });
    }
  } catch (error) {
    console.error("[initializeUserBalances] Failed to initialize balances", {
      userId,
      workspaceId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function startAccrualCronJobs(): void {
  cron.schedule("0 0 1 * *", () => {
    void runMonthlyAccrual().catch((error: unknown) => {
      console.error("Accrual cron failed", error);
    });
  });

  cron.schedule("0 0 1 1 *", () => {
    void runCarryForward().catch((error: unknown) => {
      console.error("Carry forward cron failed", error);
    });
  });
}
