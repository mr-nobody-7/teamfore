import { prisma } from "../lib/db.js";
import type {
  LeavePolicyUpsertInput,
  LeaveBalanceQueryResult,
} from "../types/index.js";

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getMyBalances(
  userId: string,
  workspaceId: string,
  year = new Date().getFullYear(),
): Promise<LeaveBalanceQueryResult[]> {
  const [leaveTypes, balances] = await Promise.all([
    prisma.workspaceLeaveType.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
      select: {
        id: true,
        label: true,
      },
      orderBy: { label: "asc" },
    }),
    prisma.userLeaveBalance.findMany({
      where: {
        userId,
        workspaceId,
        year,
      },
      select: {
        leaveTypeId: true,
        openingBalance: true,
        accrued: true,
        taken: true,
        carriedForward: true,
      },
    }),
  ]);

  const balanceByLeaveTypeId = new Map(
    balances.map((balance) => [balance.leaveTypeId, balance]),
  );

  return leaveTypes.map((leaveType) => {
    const balance = balanceByLeaveTypeId.get(leaveType.id);
    const openingBalance = balance?.openingBalance ?? 0;
    const accrued = balance?.accrued ?? 0;
    const taken = balance?.taken ?? 0;
    const carriedForward = balance?.carriedForward ?? 0;

    const available = Math.max(
      roundToTwoDecimals(
        openingBalance + accrued + carriedForward - taken,
      ),
      0,
    );

    return {
      leaveTypeId: leaveType.id,
      leaveTypeLabel: leaveType.label,
      accrued,
      taken,
      carriedForward,
      available,
      openingBalance,
    };
  });
}

export async function getWorkspacePolicies(workspaceId: string) {
  return prisma.workspaceLeavePolicy.findMany({
    where: { workspaceId },
    include: {
      leaveType: {
        select: {
          id: true,
          label: true,
          type: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      leaveType: { label: "asc" },
    },
  });
}

export async function upsertPolicy(
  workspaceId: string,
  leaveTypeId: string,
  policyData: LeavePolicyUpsertInput,
) {
  return prisma.workspaceLeavePolicy.upsert({
    where: {
      workspaceId_leaveTypeId: {
        workspaceId,
        leaveTypeId,
      },
    },
    create: {
      workspaceId,
      leaveTypeId,
      accrualFrequency: policyData.accrualFrequency,
      daysPerYear: policyData.daysPerYear,
      maxCarryForward: policyData.maxCarryForward,
      carryForwardExpiryMonths: policyData.carryForwardExpiryMonths,
      isActive: policyData.isActive,
    },
    update: {
      accrualFrequency: policyData.accrualFrequency,
      daysPerYear: policyData.daysPerYear,
      maxCarryForward: policyData.maxCarryForward,
      carryForwardExpiryMonths: policyData.carryForwardExpiryMonths,
      isActive: policyData.isActive,
    },
    include: {
      leaveType: {
        select: {
          id: true,
          label: true,
          type: true,
          isActive: true,
        },
      },
    },
  });
}
