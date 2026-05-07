import type { Block, KnownBlock } from "@slack/web-api";

export interface SlackInstallationData {
  teamId: string;
  teamName: string;
  botUserId: string;
  accessToken: string;
  scope: string;
  incomingWebhookUrl?: string | null;
  incomingWebhookChannel?: string | null;
}

export interface SlackMessageOptions {
  channel: string;
  text: string;
  blocks?: (KnownBlock | Block)[];
}

export interface SlackApprovalPayload {
  leaveId: string;
  requesterId: string;
  requesterName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
}
