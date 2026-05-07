import cron from "node-cron";
import { prisma } from "../../lib/db.js";
import { slackService } from "./slack.service.js";

function nowUtcHHmm(): string {
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function tomorrowRangeUtc() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function runSlackDigestOnce(): Promise<void> {
  const currentTime = nowUtcHHmm();

  const workspaces = await prisma.workspace.findMany({
    where: {
      slackDigestEnabled: true,
      slackDigestTime: currentTime,
      slackDigestChannel: { not: null },
      slackInstallation: { isNot: null },
    },
    select: {
      id: true,
      slackDigestChannel: true,
    },
  });

  const { start, end } = tomorrowRangeUtc();

  for (const workspace of workspaces) {
    if (!workspace.slackDigestChannel) {
      continue;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        user: { workspaceId: workspace.id },
        status: "APPROVED",
        startDate: { lt: end },
        endDate: { gte: start },
      },
      select: {
        type: true,
        startDate: true,
        endDate: true,
        user: { select: { name: true } },
      },
      orderBy: { startDate: "asc" },
    });

    if (leaves.length === 0) {
      continue;
    }

    const lines = leaves.map((item) => {
      const s = item.startDate.toISOString().slice(0, 10);
      const e = item.endDate.toISOString().slice(0, 10);
      return `• ${item.user.name} - ${item.type} (${s} to ${e})`;
    });

    await slackService.sendMessage(workspace.id, {
      channel: workspace.slackDigestChannel,
      text: `Tomorrow's leave summary:\n${lines.join("\n")}`,
    });
  }
}

export function startSlackDigestCron(): void {
  cron.schedule("* * * * *", () => {
    void runSlackDigestOnce().catch((error: unknown) => {
      console.error("Slack digest cron failed", error);
    });
  });
}
