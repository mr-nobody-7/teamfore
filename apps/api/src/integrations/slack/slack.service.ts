import { WebClient } from "@slack/web-api";
import { prisma } from "../../lib/db.js";
import { decrypt } from "../../utils/encryption.js";
import type { SlackMessageOptions } from "./slack.types.js";

export class SlackService {
  private async getInstallation(workspaceId: string) {
    return prisma.slackInstallation.findUnique({
      where: { workspaceId },
      include: {
        workspace: {
          select: {
            slackNotifyLeave: true,
            slackDigestEnabled: true,
            slackDigestChannel: true,
            slackDigestTime: true,
          },
        },
      },
    });
  }

  async isConnected(workspaceId: string): Promise<boolean> {
    const installation = await this.getInstallation(workspaceId);
    return installation !== null;
  }

  async getClient(workspaceId: string): Promise<WebClient | null> {
    const installation = await this.getInstallation(workspaceId);
    if (!installation) {
      return null;
    }

    const token = decrypt(installation.accessTokenEncrypted);
    return new WebClient(token);
  }

  async getStatus(workspaceId: string) {
    const installation = await this.getInstallation(workspaceId);

    if (!installation) {
      return {
        connected: false,
      };
    }

    return {
      connected: true,
      teamName: installation.teamName,
      connectedAt: installation.connectedAt,
      notifyLeave: installation.workspace.slackNotifyLeave,
      digestEnabled: installation.workspace.slackDigestEnabled,
      digestChannel: installation.workspace.slackDigestChannel,
      digestTime: installation.workspace.slackDigestTime,
    };
  }

  async sendMessage(
    workspaceId: string,
    options: SlackMessageOptions,
  ): Promise<void> {
    const client = await this.getClient(workspaceId);
    if (!client) {
      return;
    }

    await client.chat.postMessage({
      channel: options.channel,
      text: options.text,
      blocks: options.blocks,
    });
  }

  async sendToDefaultChannel(
    workspaceId: string,
    text: string,
    blocks?: SlackMessageOptions["blocks"],
  ): Promise<void> {
    const installation = await this.getInstallation(workspaceId);
    if (!installation?.incomingWebhookChannel) {
      return;
    }

    await this.sendMessage(workspaceId, {
      channel: installation.incomingWebhookChannel,
      text,
      ...(blocks ? { blocks } : {}),
    });
  }

  async findWorkspaceByTeamId(teamId: string) {
    const installation = await prisma.slackInstallation.findFirst({
      where: { teamId },
      select: { workspaceId: true },
    });

    return installation?.workspaceId ?? null;
  }
}

export const slackService = new SlackService();
