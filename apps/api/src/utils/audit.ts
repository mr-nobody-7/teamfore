import type { AuditAction } from "../generated/prisma/client.js";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";

export interface AuditLogParams {
  action: AuditAction;
  /** Actor — omit for unauthenticated / failed-auth events */
  userId?: string | undefined;
  workspaceId?: string | undefined;
  /** Primary entity this action touched */
  targetId?: string | undefined;
  /** "User" | "LeaveRequest" | … */
  targetType?: string | undefined;
  ipAddress?: string | undefined;
  /** Any extra context that helps reconstruct the event */
  metadata?: Prisma.InputJsonValue;
}

/**
 * Fire-and-forget audit log writer.
 *
 * Deliberately returns `void` so callers never need to await it.
 * Failures are swallowed and printed to stderr so the main request
 * flow is never affected by audit-log infrastructure issues.
 */
export const createAuditLog = (params: AuditLogParams): void => {
  prisma.auditLog
    .create({
      data: {
        action: params.action,
        userId: params.userId ?? null,
        workspaceId: params.workspaceId ?? null,
        targetId: params.targetId ?? null,
        targetType: params.targetType ?? null,
        ipAddress: params.ipAddress ?? null,
        metadata:
          params.metadata !== undefined ? params.metadata : Prisma.JsonNull,
      },
    })
    .catch((err: unknown) => console.error("[AuditLog] Failed to write:", err));
};
