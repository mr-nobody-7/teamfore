import { WebClient } from "@slack/web-api";
import { prisma } from "../../lib/db.js";
import { encrypt } from "../../utils/encryption.js";
import type { SlackInstallationData } from "./slack.types.js";

const SLACK_SCOPES = [
  "chat:write",
  "commands",
  "channels:read",
  "users:read",
  "users:read.email",
].join(",");

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSlackInstallUrl(workspaceId: string): string {
  const params = new URLSearchParams({
    client_id: requiredEnv("SLACK_CLIENT_ID"),
    scope: SLACK_SCOPES,
    redirect_uri: requiredEnv("SLACK_REDIRECT_URI"),
    state: workspaceId,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<SlackInstallationData> {
  const client = new WebClient();
  const result = await client.oauth.v2.access({
    client_id: requiredEnv("SLACK_CLIENT_ID"),
    client_secret: requiredEnv("SLACK_CLIENT_SECRET"),
    code,
    redirect_uri: requiredEnv("SLACK_REDIRECT_URI"),
  });

  if (
    !result.ok ||
    !result.access_token ||
    !result.team?.id ||
    !result.team?.name
  ) {
    throw new Error(`Slack OAuth failed: ${result.error ?? "unknown_error"}`);
  }

  return {
    teamId: result.team.id,
    teamName: result.team.name,
    botUserId: result.bot_user_id ?? "",
    accessToken: result.access_token,
    scope: result.scope ?? "",
    incomingWebhookUrl: result.incoming_webhook?.url ?? null,
    incomingWebhookChannel: result.incoming_webhook?.channel_id ?? null,
  };
}

export async function storeInstallation(
  workspaceId: string,
  installedByUserId: string | null,
  installation: SlackInstallationData,
): Promise<void> {
  const incomingWebhookUrl = installation.incomingWebhookUrl ?? null;
  const incomingWebhookChannel = installation.incomingWebhookChannel ?? null;

  await prisma.slackInstallation.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      installedByUserId,
      teamId: installation.teamId,
      teamName: installation.teamName,
      botUserId: installation.botUserId,
      accessTokenEncrypted: encrypt(installation.accessToken),
      scope: installation.scope,
      incomingWebhookUrl,
      incomingWebhookChannel,
    },
    update: {
      installedByUserId,
      teamId: installation.teamId,
      teamName: installation.teamName,
      botUserId: installation.botUserId,
      accessTokenEncrypted: encrypt(installation.accessToken),
      scope: installation.scope,
      incomingWebhookUrl,
      incomingWebhookChannel,
    },
  });
}

export async function disconnectSlack(workspaceId: string): Promise<void> {
  await prisma.$transaction([
    prisma.slackInstallation.deleteMany({ where: { workspaceId } }),
    prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        slackDigestEnabled: false,
        slackDigestChannel: null,
        slackDigestTime: null,
      },
    }),
  ]);
}
