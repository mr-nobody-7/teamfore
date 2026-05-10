import type { Request, Response } from "express";
import { prisma } from "../../lib/db.js";
import { slackService } from "./slack.service.js";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SlackCommandPayload {
  command: string;
  text: string;
  user_id: string;
  team_id: string;
  channel_id: string;
  response_url: string;
  trigger_id: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function resolveWorkspace(slackTeamId: string) {
  const install = await prisma.slackInstallation.findFirst({
    where: { teamId: slackTeamId },
    select: { workspaceId: true, teamId: true, teamName: true },
  });

  if (!install) {
    return null;
  }

  return { workspaceId: install.workspaceId, install };
}

function ackAndProcess(res: Response, fn: () => Promise<void>): void {
  res.status(200).json({ response_type: "ephemeral", text: "One moment..." });

  fn().catch((err) => {
    console.error("[slack:command] background task failed:", err);
  });
}

type SlackBlock = Record<string, unknown>;

async function postToResponseUrl(
  responseUrl: string,
  body: { response_type: string; text: string; blocks?: SlackBlock[] },
): Promise<void> {
  await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Command stubs ──────────────────────────────────────────────────────────────

async function handleWhosOut(
  payload: SlackCommandPayload,
  workspaceId: string,
): Promise<void> {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Build leave-type label map for this workspace
  const leaveTypes = await prisma.workspaceLeaveType.findMany({
    where: { workspaceId },
    select: { type: true, label: true },
  });
  const leaveTypeLabel = new Map(leaveTypes.map((lt) => [lt.type, lt.label]));

  // Approved leaves that overlap today
  // LeaveRequest has no direct workspaceId — scope via user relation
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      user: { workspaceId },
      status: "APPROVED",
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    },
    select: {
      userId: true,
      type: true,
      endDate: true,
      user: { select: { name: true } },
    },
  });

  const leaveUserIds = new Set(leaves.map((l) => l.userId));

  // Non-available availability statuses today, excluding users already in leaves
  const availabilities = await prisma.userAvailabilityStatus.findMany({
    where: {
      workspaceId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { not: "AVAILABLE" },
      ...(leaveUserIds.size > 0 ? { userId: { notIn: [...leaveUserIds] } } : {}),
    },
    select: {
      status: true,
      user: { select: { name: true } },
    },
  });

  if (leaves.length === 0 && availabilities.length === 0) {
    await postToResponseUrl(payload.response_url, {
      response_type: "in_channel",
      text: "✅ Full team available today — no one is on leave or away",
    });
    return;
  }

  const lines: string[] = [];

  for (const leave of leaves) {
    const label = leaveTypeLabel.get(leave.type) ?? leave.type;
    const until = leave.endDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    lines.push(`🏖️ ${leave.user.name} — ${label} (until ${until})`);
  }

  for (const avail of availabilities) {
    switch (avail.status) {
      case "WORKING_REMOTELY":
        lines.push(`🏠 ${avail.user.name} — Working remotely`);
        break;
      case "FOCUS_TIME":
        lines.push(`🔆 ${avail.user.name} — Focus time`);
        break;
      case "BUSY":
        lines.push(`🔴 ${avail.user.name} — Busy`);
        break;
      case "HALF_DAY":
        lines.push(`🌗 ${avail.user.name} — Half day`);
        break;
      case "ON_LEAVE":
        lines.push(`🏖️ ${avail.user.name} — On leave`);
        break;
    }
  }

  await postToResponseUrl(payload.response_url, {
    response_type: "in_channel",
    text: `*Who's out today:*\n${lines.join("\n")}`,
  });
}

async function handleMyLeaves(
  payload: SlackCommandPayload,
  workspaceId: string,
): Promise<void> {
  // ── Step 1: Resolve the TeamFore user from Slack user_id ──────────────────

  let user = await prisma.user.findFirst({
    where: { workspaceId, slackUserId: payload.user_id },
    select: { id: true, email: true, slackUserId: true },
  });

  if (!user) {
    // Fallback: look up email via Slack API, then match by email
    const client = await slackService.getClient(workspaceId);
    if (client) {
      try {
        const info = await client.users.info({ user: payload.user_id });
        const email = info.user?.profile?.email;
        if (email) {
          user = await prisma.user.findFirst({
            where: { workspaceId, email },
            select: { id: true, email: true, slackUserId: true },
          });

          if (user) {
            // Fire-and-forget: cache the Slack user ID for future lookups
            prisma.user
              .update({
                where: { id: user.id },
                data: { slackUserId: payload.user_id },
              })
              .catch((err) => {
                console.error("[slack:my-leaves] failed to cache slackUserId:", err);
              });
          }
        }
      } catch (err) {
        console.error("[slack:my-leaves] Slack users.info failed:", err);
      }
    }
  }

  if (!user) {
    await postToResponseUrl(payload.response_url, {
      response_type: "ephemeral",
      text: "I couldn't find your TeamFore account. Make sure you signed up with the same email address linked to your Slack account, then try again.",
    });
    return;
  }

  // ── Step 2: Fetch upcoming approved leaves ────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      userId: user.id,
      user: { workspaceId },
      status: "APPROVED",
      endDate: { gte: today },
    },
    orderBy: { startDate: "asc" },
    take: 5,
    select: {
      type: true,
      startDate: true,
      endDate: true,
    },
  });

  // ── Step 3: Leave balances ────────────────────────────────────────────────
  // TODO: implement once LeaveBalance model is added to the schema

  // ── Step 4: Build and send the response ──────────────────────────────────

  const dateOpts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  const formatDate = (d: Date) => d.toLocaleDateString("en-IN", dateOpts);

  function dayCount(start: Date, end: Date): string {
    const ms = end.getTime() - start.getTime();
    const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  // Build leave-type label map
  const leaveTypes = await prisma.workspaceLeaveType.findMany({
    where: { workspaceId },
    select: { type: true, label: true },
  });
  const leaveTypeLabel = new Map(leaveTypes.map((lt) => [lt.type, lt.label]));

  let text: string;

  if (leaves.length === 0) {
    text = "*You have no upcoming approved leaves.*";
  } else {
    const lines = leaves.map((l) => {
      const label = leaveTypeLabel.get(l.type) ?? l.type;
      return `• ${label}: ${formatDate(l.startDate)} – ${formatDate(l.endDate)} (${dayCount(l.startDate, l.endDate)})`;
    });
    text = `*Your upcoming leaves:*\n${lines.join("\n")}`;
  }

  text += "\n_View full history at teamfore.com/leaves_";

  await postToResponseUrl(payload.response_url, {
    response_type: "ephemeral",
    text,
  });
}

async function handleTeamStatus(
  payload: SlackCommandPayload,
  workspaceId: string,
): Promise<void> {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // ── Step 1: Parallel data fetch ────────────────────────────────────────────

  const [users, availabilities, leaves, workloads, leaveTypes] = await Promise.all([
    prisma.user.findMany({
      where: { workspaceId, isActive: true },
      select: { id: true, name: true },
    }),
    prisma.userAvailabilityStatus.findMany({
      where: {
        workspaceId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      select: { userId: true, status: true },
    }),
    prisma.leaveRequest.findMany({
      where: {
        user: { workspaceId },
        status: "APPROVED",
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
      select: { userId: true, type: true },
    }),
    prisma.userWorkloadStatus.findMany({
      where: {
        workspaceId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      select: { userId: true, workload: true },
    }),
    prisma.workspaceLeaveType.findMany({
      where: { workspaceId },
      select: { type: true, label: true },
    }),
  ]);

  // ── Step 2: Build lookup maps ──────────────────────────────────────────────

  const availMap = new Map(availabilities.map((a) => [a.userId, a.status]));
  const leaveMap = new Map(leaves.map((l) => [l.userId, l.type]));
  const workloadMap = new Map(workloads.map((w) => [w.userId, w.workload]));
  const leaveTypeLabel = new Map(leaveTypes.map((lt) => [lt.type, lt.label]));

  type EffectiveStatus =
    | "ON_LEAVE"
    | "WORKING_REMOTELY"
    | "FOCUS_TIME"
    | "BUSY"
    | "HALF_DAY"
    | "AVAILABLE";

  const GROUP_ORDER: EffectiveStatus[] = [
    "ON_LEAVE",
    "WORKING_REMOTELY",
    "FOCUS_TIME",
    "BUSY",
    "HALF_DAY",
    "AVAILABLE",
  ];

  const GROUP_EMOJI: Record<EffectiveStatus, string> = {
    ON_LEAVE: "🏖️",
    WORKING_REMOTELY: "🏠",
    FOCUS_TIME: "🔆",
    BUSY: "🔴",
    HALF_DAY: "🌗",
    AVAILABLE: "🟢",
  };

  const GROUP_LABEL: Record<EffectiveStatus, string> = {
    ON_LEAVE: "On leave",
    WORKING_REMOTELY: "Working remotely",
    FOCUS_TIME: "Focus time",
    BUSY: "Busy",
    HALF_DAY: "Half day",
    AVAILABLE: "Available",
  };

  // ── Step 3: Determine effective status and group ───────────────────────────

  const groups = new Map<EffectiveStatus, { name: string; leaveLabel: string | undefined; heavy: boolean }[]>(
    GROUP_ORDER.map((s) => [s, []]),
  );

  for (const user of users) {
    let status: EffectiveStatus;
    let leaveLabel: string | undefined;

    if (leaveMap.has(user.id)) {
      status = "ON_LEAVE";
      const leaveType = leaveMap.get(user.id);
      leaveLabel = leaveType !== undefined ? (leaveTypeLabel.get(leaveType) ?? leaveType) : undefined;
    } else {
      const avail = availMap.get(user.id);
      status = (avail as EffectiveStatus | undefined) ?? "AVAILABLE";
    }

    const workload = workloadMap.get(user.id);
    const heavy = workload === "HEAVY";

    const bucket = groups.get(status);
    if (bucket) {
      bucket.push({ name: user.name, leaveLabel, heavy });
    }
  }

  // ── Step 4: Build Block Kit message ───────────────────────────────────────

  const totalUsers = users.length;
  const availableCount = groups.get("AVAILABLE")?.length ?? 0;
  const capacityPct =
    totalUsers === 0 ? 100 : Math.round((availableCount / totalUsers) * 100);
  const capacityEmoji = capacityPct >= 80 ? "🟢" : capacityPct >= 50 ? "🟡" : "🔴";

  const dayLabel = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const blocks: SlackBlock[] = [];

  // Header
  blocks.push({
    type: "header",
    text: { type: "plain_text", text: `📊 Team Status — ${dayLabel}`, emoji: true },
  });

  // Status sections
  const nonEmptyGroups = GROUP_ORDER.filter((s) => (groups.get(s)?.length ?? 0) > 0);
  const allAvailable =
    nonEmptyGroups.length === 1 && nonEmptyGroups[0] === "AVAILABLE";

  if (allAvailable) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: "✅ Everyone is available today!" },
    });
  } else {
    for (const status of GROUP_ORDER) {
      const members = groups.get(status);
      if (!members || members.length === 0) continue;

      const emoji = GROUP_EMOJI[status];
      const label = GROUP_LABEL[status];

      const nameList = members
        .map((m) => {
          let entry = m.name;
          if (status === "ON_LEAVE" && m.leaveLabel) {
            entry += ` (${m.leaveLabel})`;
          }
          if (m.heavy) {
            entry += " ⚠️";
          }
          return entry;
        })
        .join(" · ");

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${label} (${members.length})*\n${nameList}`,
        },
      });
    }
  }

  // Divider
  blocks.push({ type: "divider" });

  // Context footer
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Team capacity: *${capacityPct}%* · ${capacityEmoji} · View standup board at teamfore.com/team`,
      },
    ],
  });

  await postToResponseUrl(payload.response_url, {
    response_type: "in_channel",
    text: `Team status for today — ${capacityPct}% available`,
    blocks,
  });
}

async function handleApplyLeave(
  workspaceId: string,
  payload: SlackCommandPayload,
): Promise<void> {
  const client = await slackService.getClient(workspaceId);
  if (!client) {
    return;
  }

  // Step 1: resolve TeamFore user by slackUserId, then fallback to email lookup.
  let user = await prisma.user.findFirst({
    where: { workspaceId, slackUserId: payload.user_id },
    select: { id: true, email: true },
  });

  if (!user) {
    try {
      const info = await client.users.info({ user: payload.user_id });
      const email = info.user?.profile?.email;

      if (email) {
        user = await prisma.user.findFirst({
          where: { workspaceId, email },
          select: { id: true, email: true },
        });

        if (user) {
          void prisma.user
            .update({
              where: { id: user.id },
              data: { slackUserId: payload.user_id },
            })
            .catch((err) => {
              console.error("[slack:apply-leave] failed to cache slackUserId:", err);
            });
        }
      }
    } catch (err) {
      console.error("[slack:apply-leave] Slack users.info failed:", err);
    }
  }

  if (!user) {
    await client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: "I couldn't find your TeamFore account. Sign up at teamfore.com first.",
    });
    return;
  }

  // Step 2: fetch active leave types for this workspace.
  const leaveTypes = await prisma.workspaceLeaveType.findMany({
    where: { workspaceId, isActive: true },
    orderBy: { label: "asc" },
    select: { id: true, type: true, label: true },
  });

  // Step 3: LeaveBalance model does not exist yet in this schema.
  // TODO: fetch leave balances when LeaveBalance is added.

  const today = new Date();
  const initialDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const leaveTypeOptions = leaveTypes.map((leaveType) => ({
    text: {
      type: "plain_text" as const,
      text: leaveType.label,
      emoji: true,
    },
    value: leaveType.id,
  }));

  await client.views.open({
    trigger_id: payload.trigger_id,
    view: {
      type: "modal",
      callback_id: "apply_leave_modal",
      title: {
        type: "plain_text",
        text: "Apply for Leave",
      },
      submit: {
        type: "plain_text",
        text: "Submit Request",
      },
      close: {
        type: "plain_text",
        text: "Cancel",
      },
      private_metadata: JSON.stringify({
        workspaceId,
        slackUserId: payload.user_id,
      }),
      blocks: [
        {
          type: "input",
          block_id: "leave_type_block",
          label: {
            type: "plain_text",
            text: "Leave type",
          },
          element: {
            type: "static_select",
            action_id: "leave_type_select",
            options: leaveTypeOptions,
          },
        },
        {
          type: "input",
          block_id: "start_date_block",
          label: {
            type: "plain_text",
            text: "Start date",
          },
          element: {
            type: "datepicker",
            action_id: "start_date_picker",
            initial_date: initialDate,
          },
        },
        {
          type: "input",
          block_id: "end_date_block",
          label: {
            type: "plain_text",
            text: "End date",
          },
          element: {
            type: "datepicker",
            action_id: "end_date_picker",
            initial_date: initialDate,
          },
        },
        {
          type: "input",
          block_id: "session_block",
          label: {
            type: "plain_text",
            text: "Session",
          },
          element: {
            type: "static_select",
            action_id: "session_select",
            options: [
              {
                text: {
                  type: "plain_text",
                  text: "Full Day",
                },
                value: "FULL_DAY",
              },
              {
                text: {
                  type: "plain_text",
                  text: "First Half",
                },
                value: "FIRST_HALF",
              },
              {
                text: {
                  type: "plain_text",
                  text: "Second Half",
                },
                value: "SECOND_HALF",
              },
            ],
            initial_option: {
              text: {
                type: "plain_text",
                text: "Full Day",
              },
              value: "FULL_DAY",
            },
          },
        },
        {
          type: "input",
          block_id: "reason_block",
          optional: true,
          label: {
            type: "plain_text",
            text: "Reason",
          },
          element: {
            type: "plain_text_input",
            action_id: "reason_input",
            multiline: true,
            max_length: 500,
          },
        },
      ],
    },
  });
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function handleSlashCommand(req: Request, res: Response): Promise<void> {
  const payload = req.body as SlackCommandPayload;

  const resolved = await resolveWorkspace(payload.team_id);
  if (!resolved) {
    res.status(200).json({
      response_type: "ephemeral",
      text: "TeamFore isn't connected to this Slack workspace. Ask your admin to connect it at teamfore.com/settings",
    });
    return;
  }

  const { workspaceId } = resolved;

  switch (payload.command) {
    case "/whos-out":
      ackAndProcess(res, () => handleWhosOut(payload, workspaceId));
      break;

    case "/my-leaves":
      ackAndProcess(res, () => handleMyLeaves(payload, workspaceId));
      break;

    case "/team-status":
      ackAndProcess(res, () => handleTeamStatus(payload, workspaceId));
      break;

    case "/apply-leave":
      await handleApplyLeave(workspaceId, payload);
      res.status(200).send();
      break;

    default:
      res.status(200).json({ response_type: "ephemeral", text: "Unknown command" });
  }
}
