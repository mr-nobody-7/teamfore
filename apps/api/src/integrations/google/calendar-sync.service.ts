import { google } from "googleapis";
import { prisma } from "../../lib/db.js";
import { getGoogleClient } from "./google-calendar.service.js";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + 1);
  return copy;
}

function isGoogleNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    code?: number;
    response?: {
      status?: number;
      data?: { error?: { code?: number; status?: string } };
    };
  };

  if (maybeError.code === 404 || maybeError.response?.status === 404) {
    return true;
  }

  return maybeError.response?.data?.error?.code === 404;
}

export async function syncLeaveApproved(leaveId: string): Promise<void> {
  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            workspaceId: true,
            workspace: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!leave) {
      return;
    }

    const leaveType = await prisma.workspaceLeaveType.findFirst({
      where: {
        workspaceId: leave.user.workspaceId,
        type: leave.type,
      },
      select: { label: true },
    });

    const leaveTypeLabel = leaveType?.label ?? leave.type;
    const client = await getGoogleClient(leave.userId);

    if (!client) {
      return;
    }

    const calendar = google.calendar({ version: "v3", auth: client });

    const eventResponse = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `OOO — ${leaveTypeLabel}`,
        description: "Time off approved via TeamFore",
        start: { date: toIsoDate(leave.startDate) },
        end: { date: toIsoDate(nextDay(leave.endDate)) },
        status: "confirmed",
        transparency: "opaque",
        outOfOffice: { autoDeclineMode: "declineNone" },
      } as unknown as Record<string, unknown>,
    });

    if (!eventResponse.data.id) {
      return;
    }

    await prisma.leaveRequest.update({
      where: { id: leave.id },
      data: { googleCalendarEventId: eventResponse.data.id },
    });
  } catch (error) {
    const leave = await prisma.leaveRequest
      .findUnique({
        where: { id: leaveId },
        select: { userId: true },
      })
      .catch(() => null);

    console.error("[syncLeaveApproved] Failed to sync approved leave", {
      leaveId,
      userId: leave?.userId ?? null,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function syncLeaveRemoved(leaveId: string): Promise<void> {
  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      select: {
        id: true,
        userId: true,
        googleCalendarEventId: true,
      },
    });

    if (!leave || !leave.googleCalendarEventId) {
      return;
    }

    const client = await getGoogleClient(leave.userId);
    if (!client) {
      return;
    }

    const calendar = google.calendar({ version: "v3", auth: client });

    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: leave.googleCalendarEventId,
      });
    } catch (error) {
      if (!isGoogleNotFoundError(error)) {
        throw error;
      }
    }

    await prisma.leaveRequest.update({
      where: { id: leave.id },
      data: { googleCalendarEventId: null },
    });
  } catch (error) {
    const leave = await prisma.leaveRequest
      .findUnique({
        where: { id: leaveId },
        select: { userId: true },
      })
      .catch(() => null);

    console.error("[syncLeaveRemoved] Failed to remove leave calendar event", {
      leaveId,
      userId: leave?.userId ?? null,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function createSharedWorkspaceCalendar(
  workspaceId: string,
  adminUserId: string,
): Promise<string | null> {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    if (!workspace) {
      return null;
    }

    const client = await getGoogleClient(adminUserId);
    if (!client) {
      return null;
    }

    const calendar = google.calendar({ version: "v3", auth: client });

    const created = await calendar.calendars.insert({
      requestBody: {
        summary: `TeamFore — ${workspace.name}`,
        description: "Team leave calendar managed by TeamFore",
        timeZone: "Asia/Kolkata",
      },
    });

    return created.data.id ?? null;
  } catch (error) {
    console.error(
      "[createSharedWorkspaceCalendar] Failed to create shared workspace calendar",
      {
        workspaceId,
        userId: adminUserId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return null;
  }
}
