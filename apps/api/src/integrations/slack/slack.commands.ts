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

const GENERIC_SLACK_ERROR_TEXT =
  "Something went wrong — please try again or use the TeamFore web app";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function logCommandError(
  command: string,
  workspaceId: string,
  error: unknown,
): void {
  console.error(
    `[slack:${command}] ${getErrorMessage(error)} | workspaceId=${workspaceId} | command=${command}`,
  );
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

function ackAndProcess(
  res: Response,
  workspaceId: string,
  command: string,
  payload: SlackCommandPayload,
  fn: () => Promise<void>,
): void {
  res.status(200).json({ response_type: "ephemeral", text: "One moment..." });

  fn().catch((err) => {
    logCommandError(command, workspaceId, err);
    void postToResponseUrl(
      payload.response_url,
      { response_type: "ephemeral", text: GENERIC_SLACK_ERROR_TEXT },
      { workspaceId, command },
    );
  });
}

type SlackBlock = Record<string, unknown>;

async function postToResponseUrl(
  responseUrl: string,
  body: { response_type: string; text: string; blocks?: SlackBlock[] },
  context: { workspaceId: string; command: string },
): Promise<void> {
  try {
    const response = await fetch(responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(
        `[slack:${context.command}] response_url delivery failed with ${response.status} ${response.statusText} | workspaceId=${context.workspaceId} | command=${context.command}`,
      );
    }
  } catch (error) {
    console.error(
      `[slack:${context.command}] response_url fetch failed: ${getErrorMessage(error)} | workspaceId=${context.workspaceId} | command=${context.command}`,
    );
  }
}

async function sendGenericCommandError(
  payload: SlackCommandPayload,
  workspaceId: string,
  command: string,
  error: unknown,
): Promise<void> {
  logCommandError(command, workspaceId, error);
  await postToResponseUrl(
    payload.response_url,
    { response_type: "ephemeral", text: GENERIC_SLACK_ERROR_TEXT },
    { workspaceId, command },
  );
}

// ── Command stubs ──────────────────────────────────────────────────────────────

async function handleWhosOut(
  payload: SlackCommandPayload,
  workspaceId: string,
): Promise<void> {
  const command = "/whos-out";

  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const leaveTypes = await prisma.workspaceLeaveType.findMany({
      where: { workspaceId },
      select: { type: true, label: true },
    });
    const leaveTypeLabel = new Map(leaveTypes.map((lt) => [lt.type, lt.label]));

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

    const availabilities = await prisma.userAvailabilityStatus.findMany({
      where: {
        workspaceId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: "AVAILABLE" },
        ...(leaveUserIds.size > 0
          ? { userId: { notIn: [...leaveUserIds] } }
          : {}),
      },
      select: {
        status: true,
        user: { select: { name: true } },
      },
    });

    if (leaves.length === 0 && availabilities.length === 0) {
      await postToResponseUrl(
        payload.response_url,
        {
          response_type: "in_channel",
          text: "✅ Full team available today — nobody is on leave or away",
        },
        { workspaceId, command },
      );
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

    await postToResponseUrl(
      payload.response_url,
      {
        response_type: "in_channel",
        text: `*Who's out today:*\n${lines.join("\n")}`,
      },
      { workspaceId, command },
    );
  } catch (error) {
    await sendGenericCommandError(payload, workspaceId, command, error);
  }
}

async function handleMyLeaves(
  payload: SlackCommandPayload,
  workspaceId: string,
): Promise<void> {
  const command = "/my-leaves";

  try {
    let user = await prisma.user.findFirst({
      where: { workspaceId, slackUserId: payload.user_id },
      select: { id: true, email: true, slackUserId: true },
    });

    if (!user) {
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
              void prisma.user
                .update({
                  where: { id: user.id },
                  data: { slackUserId: payload.user_id },
                })
                .catch((err) => {
                  logCommandError(command, workspaceId, err);
                });
            }
          }
        } catch (error) {
          await sendGenericCommandError(payload, workspaceId, command, error);
          return;
        }
      }
    }

    if (!user) {
      await postToResponseUrl(
        payload.response_url,
        {
          response_type: "ephemeral",
          text: "I couldn't find your TeamFore account. Make sure you signed up with the same email as your Slack account, or sign up at teamfore.com",
        },
        { workspaceId, command },
      );
      return;
    }

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

    const leaveTypes = await prisma.workspaceLeaveType.findMany({
      where: { workspaceId },
      select: { type: true, label: true },
    });
    const leaveTypeLabel = new Map(leaveTypes.map((lt) => [lt.type, lt.label]));

    let text: string;

    if (leaves.length === 0) {
      text =
        "You have no upcoming approved leaves. Apply at teamfore.com/leaves";
    } else {
      const lines = leaves.map((l) => {
        const label = leaveTypeLabel.get(l.type) ?? l.type;
        return `• ${label}: ${formatDate(l.startDate)} – ${formatDate(l.endDate)} (${dayCount(l.startDate, l.endDate)})`;
      });
      text = `*Your upcoming leaves:*\n${lines.join("\n")}`;
      text += "\n_View full history at teamfore.com/leaves_";
    }

    await postToResponseUrl(
      payload.response_url,
      {
        response_type: "ephemeral",
        text,
      },
      { workspaceId, command },
    );
  } catch (error) {
    await sendGenericCommandError(payload, workspaceId, command, error);
  }
}

async function handleTeamStatus(
  payload: SlackCommandPayload,
  workspaceId: string,
): Promise<void> {
  const command = "/team-status";

  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [users, availabilities, leaves, workloads, leaveTypes] =
      await Promise.all([
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

    if (users.length === 0) {
      await postToResponseUrl(
        payload.response_url,
        {
          response_type: "in_channel",
          text: "No team members found. Add your team at teamfore.com/team",
        },
        { workspaceId, command },
      );
      return;
    }

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

    const groups = new Map<
      EffectiveStatus,
      { name: string; leaveLabel: string | undefined; heavy: boolean }[]
    >(GROUP_ORDER.map((s) => [s, []]));

    for (const user of users) {
      let status: EffectiveStatus;
      let leaveLabel: string | undefined;

      if (leaveMap.has(user.id)) {
        status = "ON_LEAVE";
        const leaveType = leaveMap.get(user.id);
        leaveLabel =
          leaveType !== undefined
            ? (leaveTypeLabel.get(leaveType) ?? leaveType)
            : undefined;
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
    const capacityEmoji =
      capacityPct >= 80 ? "🟢" : capacityPct >= 50 ? "🟡" : "🔴";

    const dayLabel = today.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

    const blocks: SlackBlock[] = [];

    // Header
    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Team Status — ${dayLabel}`,
        emoji: true,
      },
    });

    // Status sections
    const nonEmptyGroups = GROUP_ORDER.filter(
      (s) => (groups.get(s)?.length ?? 0) > 0,
    );
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

    await postToResponseUrl(
      payload.response_url,
      {
        response_type: "in_channel",
        text: `Team status for today — ${capacityPct}% available`,
        blocks,
      },
      { workspaceId, command },
    );
  } catch (error) {
    await sendGenericCommandError(payload, workspaceId, command, error);
  }
}

async function handleApplyLeave(
  workspaceId: string,
  payload: SlackCommandPayload,
): Promise<void> {
  const command = "/apply-leave";

  try {
    const client = await slackService.getClient(workspaceId);
    if (!client) {
      await postToResponseUrl(
        payload.response_url,
        { response_type: "ephemeral", text: GENERIC_SLACK_ERROR_TEXT },
        { workspaceId, command },
      );
      return;
    }

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
                logCommandError(command, workspaceId, err);
              });
          }
        }
      } catch (error) {
        await sendGenericCommandError(payload, workspaceId, command, error);
        return;
      }
    }

    if (!user) {
      try {
        await client.chat.postEphemeral({
          channel: payload.channel_id,
          user: payload.user_id,
          text: "I couldn't find your TeamFore account. Make sure you signed up with the same email as your Slack account, or sign up at teamfore.com",
        });
      } catch (error) {
        await sendGenericCommandError(payload, workspaceId, command, error);
      }
      return;
    }

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

    try {
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
    } catch (error) {
      const message = getErrorMessage(error);
      if (
        message.includes("expired_trigger_id") ||
        message.includes("invalid_trigger_id")
      ) {
        console.error(
          `[slack:${command}] trigger_id expired for /apply-leave — user must retry (${message}) | workspaceId=${workspaceId} | command=${command}`,
        );
        return;
      }

      await sendGenericCommandError(payload, workspaceId, command, error);
    }
  } catch (error) {
    await sendGenericCommandError(payload, workspaceId, command, error);
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function handleSlashCommand(
  req: Request,
  res: Response,
): Promise<void> {
  const payload = req.body as SlackCommandPayload;

  let resolved: Awaited<ReturnType<typeof resolveWorkspace>>;
  try {
    resolved = await resolveWorkspace(payload.team_id);
  } catch (error) {
    console.error(
      `[slack:${payload.command || "unknown"}] ${getErrorMessage(error)} | workspaceId=unknown | command=${payload.command || "unknown"}`,
    );
    res.status(200).json({
      response_type: "ephemeral",
      text: GENERIC_SLACK_ERROR_TEXT,
    });
    return;
  }

  if (!resolved) {
    res.status(200).json({
      response_type: "ephemeral",
      text: "TeamFore isn't connected to this Slack workspace. Ask your workspace admin to connect it at teamfore.com/settings",
    });
    return;
  }

  const { workspaceId } = resolved;

  try {
    switch (payload.command) {
      case "/whos-out":
        ackAndProcess(res, workspaceId, "/whos-out", payload, () =>
          handleWhosOut(payload, workspaceId),
        );
        break;

      case "/my-leaves":
        ackAndProcess(res, workspaceId, "/my-leaves", payload, () =>
          handleMyLeaves(payload, workspaceId),
        );
        break;

      case "/team-status":
        ackAndProcess(res, workspaceId, "/team-status", payload, () =>
          handleTeamStatus(payload, workspaceId),
        );
        break;

      case "/apply-leave":
        await handleApplyLeave(workspaceId, payload);
        res.status(200).send();
        break;

      default:
        res
          .status(200)
          .json({ response_type: "ephemeral", text: "Unknown command" });
    }
  } catch (error) {
    logCommandError(payload.command || "unknown", workspaceId, error);
    res.status(200).json({
      response_type: "ephemeral",
      text: GENERIC_SLACK_ERROR_TEXT,
    });
  }
}
