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
  const balances = await prisma.userLeaveBalance.findMany({
    where: {
      userId,
      workspaceId,
      year,
    },
    include: {
      leaveType: {
        select: {
          id: true,
          label: true,
        },
      },
    },
    orderBy: {
      leaveType: { label: "asc" },
    },
  });

  return balances.map((balance) => {
    const available = Math.max(
      roundToTwoDecimals(
        balance.openingBalance +
          balance.accrued +
          balance.carriedForward -
          balance.taken,
      ),
      0,
    );

    return {
      leaveTypeId: balance.leaveTypeId,
      leaveTypeLabel: balance.leaveType.label,
      accrued: balance.accrued,
      taken: balance.taken,
      carriedForward: balance.carriedForward,
      available,
      openingBalance: balance.openingBalance,
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
