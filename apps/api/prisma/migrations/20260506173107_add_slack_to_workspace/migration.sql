-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "slackAccessToken" TEXT,
ADD COLUMN     "slackBotUserId" TEXT,
ADD COLUMN     "slackChannelId" TEXT,
ADD COLUMN     "slackConnectedAt" TIMESTAMP(3),
ADD COLUMN     "slackTeamId" TEXT,
ADD COLUMN     "slackTeamName" TEXT,
ADD COLUMN     "slackWebhookUrl" TEXT;

-- AlterTable
ALTER TABLE "WorkspaceLeaveType" ALTER COLUMN "label" DROP DEFAULT;
