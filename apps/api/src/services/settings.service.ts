import { randomUUID } from "node:crypto";
import { prisma } from "../lib/db.js";
import type {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  UpdateLeaveTypesInput,
} from "../types/index.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

// ── Built-in leave types seeded for every workspace ──────────────────────────
const BUILT_IN_LEAVE_TYPES: { type: string; label: string }[] = [
  { type: "VACATION", label: "Earned Leave" },
  { type: "SICK", label: "Sick Leave" },
  { type: "PERSONAL", label: "Comp Off" },
  { type: "CASUAL", label: "Casual Leave" },
];

async function ensureLeaveTypeRows(workspaceId: string) {
  const existing = await prisma.workspaceLeaveType.findMany({
    where: { workspaceId },
    select: { type: true },
  });

  const existingTypes = new Set(existing.map((row) => row.type));
  const missing = BUILT_IN_LEAVE_TYPES.filter(
    ({ type }) => !existingTypes.has(type),
  );

  if (missing.length > 0) {
    await prisma.workspaceLeaveType.createMany({
      data: missing.map(({ type, label }) => ({
        workspaceId,
        type,
        label,
        isActive: true,
        isCustom: false,
      })),
      skipDuplicates: true,
    });
  }
}

export const listWorkspaceLeaveTypes = async (workspaceId: string) => {
  await ensureLeaveTypeRows(workspaceId);

  const rows = await prisma.workspaceLeaveType.findMany({
    where: { workspaceId },
    orderBy: [{ isCustom: "asc" }, { label: "asc" }],
    select: {
      id: true,
      type: true,
      label: true,
      isActive: true,
      isCustom: true,
      updatedAt: true,
    },
  });

  return {
    leaveTypes: rows,
    enabledTypes: rows.filter((row) => row.isActive).map((row) => row.type),
  };
};

export const updateWorkspaceLeaveTypes = async (
  workspaceId: string,
  input: UpdateLeaveTypesInput,
) => {
  await ensureLeaveTypeRows(workspaceId);

  const enabled = new Set(input.enabled_types);

  await prisma.$transaction([
    prisma.workspaceLeaveType.updateMany({
      where: { workspaceId },
      data: { isActive: false },
    }),
    prisma.workspaceLeaveType.updateMany({
      where: { workspaceId, type: { in: Array.from(enabled) } },
      data: { isActive: true },
    }),
  ]);

  return listWorkspaceLeaveTypes(workspaceId);
};

export const createWorkspaceLeaveType = async (
  workspaceId: string,
  input: CreateLeaveTypeInput,
) => {
  await ensureLeaveTypeRows(workspaceId);

  // Use a unique key for custom types so labels can be renamed freely
  const type = randomUUID();

  const created = await prisma.workspaceLeaveType.create({
    data: {
      workspaceId,
      type,
      label: input.label,
      isActive: true,
      isCustom: true,
    },
    select: {
      id: true,
      type: true,
      label: true,
      isActive: true,
      isCustom: true,
      updatedAt: true,
    },
  });

  return created;
};

export const updateWorkspaceLeaveType = async (
  workspaceId: string,
  id: string,
  input: UpdateLeaveTypeInput,
) => {
  const row = await prisma.workspaceLeaveType.findFirst({
    where: { id, workspaceId },
  });

  if (!row) {
    throw new NotFoundError("Leave type not found");
  }

  // Only custom types can have their label renamed
  if (input.label !== undefined && !row.isCustom) {
    throw new BadRequestError("Built-in leave type labels cannot be changed");
  }

  // Prevent disabling the last active leave type
  if (input.isActive === false) {
    const activeCount = await prisma.workspaceLeaveType.count({
      where: { workspaceId, isActive: true },
    });
    if (activeCount <= 1) {
      throw new BadRequestError("At least one leave type must remain enabled");
    }
  }

  const updated = await prisma.workspaceLeaveType.update({
    where: { id },
    data: {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: {
      id: true,
      type: true,
      label: true,
      isActive: true,
      isCustom: true,
      updatedAt: true,
    },
  });

  return updated;
};

export const deleteWorkspaceLeaveType = async (
  workspaceId: string,
  id: string,
) => {
  const row = await prisma.workspaceLeaveType.findFirst({
    where: { id, workspaceId },
  });

  if (!row) {
    throw new NotFoundError("Leave type not found");
  }

  if (!row.isCustom) {
    throw new BadRequestError("Built-in leave types cannot be deleted");
  }

  // Prevent deleting the last active leave type
  const activeCount = await prisma.workspaceLeaveType.count({
    where: { workspaceId, isActive: true },
  });
  if (row.isActive && activeCount <= 1) {
    throw new BadRequestError("At least one leave type must remain enabled");
  }

  await prisma.workspaceLeaveType.delete({ where: { id } });
};

export const isLeaveTypeEnabledForWorkspace = async (
  workspaceId: string,
  type: string,
) => {
  await ensureLeaveTypeRows(workspaceId);

  const row = await prisma.workspaceLeaveType.findUnique({
    where: {
      workspaceId_type: {
        workspaceId,
        type,
      },
    },
    select: { isActive: true },
  });

  return row?.isActive ?? false;
};

export const getLabelMapForWorkspace = async (workspaceId: string) => {
  const rows = await prisma.workspaceLeaveType.findMany({
    where: { workspaceId },
    select: { type: true, label: true },
  });
  return Object.fromEntries(rows.map((r) => [r.type, r.label]));
};
