/*
  Warnings:

  - You are about to drop the column `slackAccessToken` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `slackBotUserId` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `slackChannelId` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `slackConnectedAt` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `slackTeamId` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `slackTeamName` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `slackWebhookUrl` on the `Workspace` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slackUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "slackDmChannel" TEXT,
ADD COLUMN     "slackUserId" TEXT;

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "slackAccessToken",
DROP COLUMN "slackBotUserId",
DROP COLUMN "slackChannelId",
DROP COLUMN "slackConnectedAt",
DROP COLUMN "slackTeamId",
DROP COLUMN "slackTeamName",
DROP COLUMN "slackWebhookUrl",
ADD COLUMN     "slackDigestChannel" TEXT,
ADD COLUMN     "slackDigestEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slackDigestTime" TEXT,
ADD COLUMN     "slackNotifyLeave" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "SlackInstallation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "botUserId" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "incomingWebhookUrl" TEXT,
    "incomingWebhookChannel" TEXT,
    "installedByUserId" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlackInstallation_workspaceId_key" ON "SlackInstallation"("workspaceId");

-- CreateIndex
CREATE INDEX "SlackInstallation_teamId_idx" ON "SlackInstallation"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "User_slackUserId_key" ON "User"("slackUserId");

-- AddForeignKey
ALTER TABLE "SlackInstallation" ADD CONSTRAINT "SlackInstallation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
