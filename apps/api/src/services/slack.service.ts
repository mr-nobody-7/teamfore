import axios from "axios";
import { prisma } from "../lib/db.js";

const SLACK_SCOPES = [
  "chat:write",
  "im:write",
  "channels:read",
  "users:read",
  "users:read.email",
  "commands",
  "incoming-webhook",
].join(",");

interface SlackOAuthAccessResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  team?: { id: string; name: string };
  bot_user_id?: string;
  incoming_webhook?: { url?: string; channel_id?: string };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSlackOAuthUrl(workspaceId: string): string {
  const params = new URLSearchParams({
    client_id: requiredEnv("SLACK_CLIENT_ID"),
    scope: SLACK_SCOPES,
    redirect_uri: requiredEnv("SLACK_REDIRECT_URI"),
    state: workspaceId,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function handleSlackOAuthCallback(
  code: string,
  workspaceId: string,
): Promise<void> {
  const payload = new URLSearchParams({
    client_id: requiredEnv("SLACK_CLIENT_ID"),
    client_secret: requiredEnv("SLACK_CLIENT_SECRET"),
    code,
    redirect_uri: requiredEnv("SLACK_REDIRECT_URI"),
  });

  const { data } = await axios.post<SlackOAuthAccessResponse>(
    "https://slack.com/api/oauth.v2.access",
    payload.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  if (!data.ok || !data.access_token || !data.team?.id || !data.team?.name) {
    throw new Error(`Slack OAuth failed: ${data.error ?? "unknown_error"}`);
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      slackAccessToken: data.access_token,
      slackTeamId: data.team.id,
      slackTeamName: data.team.name,
      slackWebhookUrl: data.incoming_webhook?.url ?? null,
      slackBotUserId: data.bot_user_id ?? null,
      slackChannelId: data.incoming_webhook?.channel_id ?? null,
      slackConnectedAt: new Date(),
    },
  });
}

export async function disconnectSlack(workspaceId: string): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      slackAccessToken: null,
      slackTeamId: null,
      slackTeamName: null,
      slackWebhookUrl: null,
      slackBotUserId: null,
      slackChannelId: null,
      slackConnectedAt: null,
    },
  });
}

async function getSlackSettings(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace?.slackAccessToken || !workspace?.slackChannelId) {
    return null;
  }
  return {
    slackAccessToken: workspace.slackAccessToken,
    slackChannelId: workspace.slackChannelId,
  };
}

async function postMessage(token: string, channel: string, payload: object): Promise<void> {
  await axios.post(
    "https://slack.com/api/chat.postMessage",
    { channel, ...payload },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
}

export async function sendLeaveNotification(
  workspaceId: string,
  data: {
    userName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    startSession: string;
    endSession: string;
    reason?: string;
  },
): Promise<void> {
  const workspace = await getSlackSettings(workspaceId);
  if (!workspace) {
    return;
  }

  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: "🏖️ Leave Request Submitted" },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Team Member:*\n${data.userName}` },
        { type: "mrkdwn", text: `*Leave Type:*\n${data.leaveType}` },
        {
          type: "mrkdwn",
          text: `*From:*\n${data.startDate} (${data.startSession})`,
        },
        {
          type: "mrkdwn",
          text: `*To:*\n${data.endDate} (${data.endSession})`,
        },
      ],
    },
    ...(data.reason
      ? [
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Reason:* ${data.reason}` },
          },
        ]
      : []),
    { type: "divider" },
  ];

  await postMessage(workspace.slackAccessToken, workspace.slackChannelId, {
    blocks,
    text: `${data.userName} submitted a ${data.leaveType} leave request`,
  });
}

export async function sendLeaveStatusNotification(
  workspaceId: string,
  data: {
    userName: string;
    leaveType: string;
    status: "APPROVED" | "REJECTED";
    comment?: string;
    approverName: string;
  },
): Promise<void> {
  const workspace = await getSlackSettings(workspaceId);
  if (!workspace) {
    return;
  }

  const emoji = data.status === "APPROVED" ? "✅" : "❌";

  await postMessage(workspace.slackAccessToken, workspace.slackChannelId, {
    text: `${emoji} *${data.userName}'s* ${data.leaveType} leave has been *${data.status.toLowerCase()}* by ${data.approverName}${data.comment ? `\n> ${data.comment}` : ""}`,
  });
}

export async function sendAvailabilityNotification(
  workspaceId: string,
  data: {
    userName: string;
    status: string;
    date: string;
  },
): Promise<void> {
  const workspace = await getSlackSettings(workspaceId);
  if (!workspace) {
    return;
  }

  const emojiMap: Record<string, string> = {
    AVAILABLE: "🟢",
    ON_LEAVE: "🏖️",
    WORKING_REMOTELY: "🏠",
    HALF_DAY: "🌓",
    BUSY: "🟡",
    FOCUS_TIME: "🎯",
  };

  const emoji = emojiMap[data.status] ?? "📋";
  const label = data.status.replace(/_/g, " ");

  await postMessage(workspace.slackAccessToken, workspace.slackChannelId, {
    text: `${emoji} *${data.userName}* is *${label}* on ${data.date}`,
  });
}
