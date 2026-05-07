import api from "@/lib/axios";

export interface SlackStatusResponse {
  connected: boolean;
  teamName?: string;
  connectedAt?: string;
  notifyLeave?: boolean;
  digestEnabled?: boolean;
  digestChannel?: string;
  digestTime?: string;
}

export async function getSlackStatus(): Promise<SlackStatusResponse> {
  const response = await api.get<SlackStatusResponse>("/slack/status");
  return response.data;
}

export async function connectSlack(): Promise<void> {
  window.location.href = "/api/slack/oauth/install";
}

export async function disconnectSlack(): Promise<void> {
  await api.delete("/slack/disconnect");
}

export async function updateSlackSettings(input: {
  slackNotifyLeave: boolean;
  slackDigestEnabled: boolean;
  slackDigestTime?: string;
  slackDigestChannel?: string;
}): Promise<void> {
  await api.patch("/slack/settings", input);
}
