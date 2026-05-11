import type { NextFunction, Request, Response } from "express";

import {
  createWorkspaceLeaveType,
  deleteWorkspaceLeaveType,
  listWorkspaceLeaveTypes,
  updateWorkspaceLeaveType,
  updateWorkspaceLeaveTypes,
} from "../services/settings.service.js";
import type {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  UpdateLeaveTypesInput,
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
