import type { NextFunction, Request, Response } from "express";
import {
  loginService,
  getMeService,
  registerUserService,
  registerWorkspaceService,
} from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";
import { createAuditLog } from "../utils/audit.js";
import { generateToken } from "../utils/jwt.js";
import type { GoogleAuthUser } from "../auth/strategies/google.strategy.js";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? "none" : "strict",
} as const;

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

function resolvePrimaryFrontendUrl(): string {
  const fromClientUrl = process.env.CLIENT_URL ?? "";
  const fromClientUrls = process.env.CLIENT_URLS ?? "";

  const configured = `${fromClientUrl},${fromClientUrls}`
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  return configured[0] ?? "http://localhost:3000";
}

function resolveDashboardRedirectUrl(): string {
  const frontendUrl = resolvePrimaryFrontendUrl();
  return new URL("/dashboard", frontendUrl).toString();
}

function issueAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 1000 * 24 * 7,
  });
}

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await registerUserService(req.body);

    createAuditLog({
      action: "USER_REGISTERED",
      userId: result.user.id,
      workspaceId: result.user.workspaceId,
      targetId: result.user.id,
      targetType: "User",
      ipAddress: req.ip,
      metadata: {
        email: result.user.email,
        name: result.user.name,
        workspaceName: result.workspace.name,
      },
    });

    sendSuccess(res, { user: result.user }, "User registered successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const registerWorkspaceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await registerWorkspaceService(req.body);

    createAuditLog({
      action: "USER_REGISTERED",
      userId: result.user.id,
      workspaceId: result.user.workspaceId,
      targetId: result.user.id,
      targetType: "User",
      ipAddress: req.ip,
      metadata: {
        email: result.user.email,
        name: result.user.name,
        workspaceName: result.workspace.name,
        leaveTypes: req.body.leaveTypes,
      },
    });

    issueAuthCookie(res, result.token);
    sendSuccess(res, { user: result.user }, "Workspace created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await loginService(req.body);

    createAuditLog({
      action: "USER_LOGIN",
      userId: result.user.id,
      workspaceId: result.user.workspaceId,
      targetId: result.user.id,
      targetType: "User",
      ipAddress: req.ip,
      metadata: { email: result.user.email },
    });

    issueAuthCookie(res, result.token);
    sendSuccess(res, { user: result.user }, "User logged in successfully");
  } catch (error) {
    // Record failed login attempts regardless of why they failed
    createAuditLog({
      action: "USER_LOGIN_FAILED",
      ipAddress: req.ip,
      metadata: { email: req.body.email as string },
    });
    next(error);
  }
};

export const googleCallbackController = (req: Request, res: Response) => {
  const oauthUser = (req as Request & { user?: GoogleAuthUser }).user;

  if (!oauthUser) {
    res.redirect(resolveDashboardRedirectUrl());
    return;
  }

  const token = generateToken({
    userId: oauthUser.userId,
    workspaceId: oauthUser.workspaceId,
    role: oauthUser.role,
    teamId: oauthUser.teamId,
  });

  issueAuthCookie(res, token);

  createAuditLog({
    action: "USER_LOGIN",
    userId: oauthUser.userId,
    workspaceId: oauthUser.workspaceId,
    targetId: oauthUser.userId,
    targetType: "User",
    ipAddress: req.ip,
    metadata: {
      email: oauthUser.email,
      provider: "google",
    },
  });

  res.redirect(resolveDashboardRedirectUrl());
};

export const googleFailureController = (req: Request, res: Response) => {
  createAuditLog({
    action: "USER_LOGIN_FAILED",
    ipAddress: req.ip,
    metadata: { provider: "google" },
  });

  const frontendUrl = resolvePrimaryFrontendUrl();
  res.redirect(new URL("/login?error=google_oauth_failed", frontendUrl).toString());
};

export const meController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // req.user is guaranteed by authenticate middleware
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = await getMeService(req.user!.userId);
    sendSuccess(res, { user }, "User fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const logoutController = (_req: Request, res: Response) => {
  res.clearCookie("token", AUTH_COOKIE_OPTIONS);
  sendSuccess(res, null, "Logged out successfully");
};