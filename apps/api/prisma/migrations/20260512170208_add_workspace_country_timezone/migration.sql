/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,date,name]` on the table `PublicHoliday` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "country" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- CreateIndex
CREATE UNIQUE INDEX "PublicHoliday_workspaceId_date_name_key" ON "PublicHoliday"("workspaceId", "date", "name");
