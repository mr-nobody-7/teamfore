import type { NextFunction, Request, Response } from "express";

import {
  createWorkspaceLeaveType,
  deleteWorkspaceLeaveType,
  listSupportedCountries,
  listWorkspaceLeaveTypes,
  updateWorkspaceRegionalSettings,
  updateWorkspaceLeaveType,
  updateWorkspaceLeaveTypes,
} from "../services/settings.service.js";
import {
  getMyBalances,
  getWorkspacePolicies,
  upsertPolicy,
} from "../services/leave-balance.service.js";
import type { LeavePolicyUpsertInput } from "../types/index.js";
import type {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  UpdateLeaveTypesInput,
  UpdateWorkspaceRegionalSettingsInput,
} from "../types/index.js";
import { createAuditLog } from "../utils/audit.js";
import { sendSuccess } from "../utils/response.js";

export const getLeaveTypesSettingsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { workspaceId } = req.user!;
    const settings = await listWorkspaceLeaveTypes(workspaceId);
    sendSuccess(res, settings, "Leave types settings fetched");
  } catch (error) {
    next(error);
  }
};

export const updateLeaveTypesSettingsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, workspaceId } = req.user!;
    const settings = await updateWorkspaceLeaveTypes(
      workspaceId,
      req.body as UpdateLeaveTypesInput,
    );

    createAuditLog({
      action: "LEAVE_TYPES_UPDATED",
      userId,
      workspaceId,
      targetType: "Workspace",
      targetId: workspaceId,
      ipAddress: req.ip,
      metadata: {
        enabledTypes: settings.enabledTypes,
      },
    });

    sendSuccess(res, settings, "Leave types settings updated");
  } catch (error) {
    next(error);
  }
};

export const createLeaveTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, workspaceId } = req.user!;
    const created = await createWorkspaceLeaveType(
      workspaceId,
      req.body as CreateLeaveTypeInput,
    );

    createAuditLog({
      action: "LEAVE_TYPES_UPDATED",
      userId,
      workspaceId,
      targetType: "Workspace",
      targetId: workspaceId,
      ipAddress: req.ip,
      metadata: { action: "created", label: created.label },
    });

    sendSuccess(res, created, "Leave type created", 201);
  } catch (error) {
    next(error);
  }
};

export const updateLeaveTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, workspaceId } = req.user!;
    const id = String(req.params.id);
    const updated = await updateWorkspaceLeaveType(
      workspaceId,
      id,
      req.body as UpdateLeaveTypeInput,
    );

    createAuditLog({
      action: "LEAVE_TYPES_UPDATED",
      userId,
      workspaceId,
      targetType: "Workspace",
      targetId: workspaceId,
      ipAddress: req.ip,
      metadata: { action: "updated", id, changes: req.body },
    });

    sendSuccess(res, updated, "Leave type updated");
  } catch (error) {
    next(error);
  }
};

export const deleteLeaveTypeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, workspaceId } = req.user!;
    const id = String(req.params.id);
    await deleteWorkspaceLeaveType(workspaceId, id);

    createAuditLog({
      action: "LEAVE_TYPES_UPDATED",
      userId,
      workspaceId,
      targetType: "Workspace",
      targetId: workspaceId,
      ipAddress: req.ip,
      metadata: { action: "deleted", id },
    });

    sendSuccess(res, null, "Leave type deleted");
  } catch (error) {
    next(error);
  }
};

export const listSupportedCountriesController = (
  _req: Request,
  res: Response,
) => {
  const countries = listSupportedCountries();
  sendSuccess(res, { countries }, "Supported countries fetched");
};

export const updateWorkspaceRegionalSettingsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { workspaceId } = req.user!;
    const updated = await updateWorkspaceRegionalSettings(
      workspaceId,
      req.body as UpdateWorkspaceRegionalSettingsInput,
    );

    sendSuccess(res, updated, "Workspace regional settings updated");
  } catch (error) {
    next(error);
  }
};

export const getMyLeaveBalancesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, workspaceId } = req.user!;
    const yearParam = typeof req.query.year === "string" ? req.query.year : undefined;
    const year = yearParam ? Number(yearParam) : undefined;
    const balances = await getMyBalances(userId, workspaceId, year);
    sendSuccess(res, { balances }, "Leave balances fetched");
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceLeavePoliciesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { workspaceId } = req.user!;
    const policies = await getWorkspacePolicies(workspaceId);
    sendSuccess(res, { policies }, "Leave policies fetched");
  } catch (error) {
    next(error);
  }
};

export const upsertLeavePolicyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { workspaceId } = req.user!;
    const input = req.body as LeavePolicyUpsertInput;
    const policy = await upsertPolicy(workspaceId, input.leaveTypeId, input);
    sendSuccess(res, { policy }, "Leave policy updated");
  } catch (error) {
    next(error);
  }
};
