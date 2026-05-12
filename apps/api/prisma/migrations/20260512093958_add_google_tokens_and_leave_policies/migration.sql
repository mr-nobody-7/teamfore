-- CreateEnum
CREATE TYPE "LeaveAccrualFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateTable
CREATE TABLE "UserGoogleToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGoogleToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceLeavePolicy" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "accrualFrequency" "LeaveAccrualFrequency" NOT NULL,
    "daysPerYear" DOUBLE PRECISION NOT NULL,
    "maxCarryForward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carryForwardExpiryMonths" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceLeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLeaveBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accrued" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carriedForward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGoogleToken_userId_key" ON "UserGoogleToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceLeavePolicy_leaveTypeId_key" ON "WorkspaceLeavePolicy"("leaveTypeId");

-- CreateIndex
CREATE INDEX "WorkspaceLeavePolicy_workspaceId_idx" ON "WorkspaceLeavePolicy"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceLeavePolicy_workspaceId_leaveTypeId_key" ON "WorkspaceLeavePolicy"("workspaceId", "leaveTypeId");

-- CreateIndex
CREATE INDEX "UserLeaveBalance_userId_idx" ON "UserLeaveBalance"("userId");

-- CreateIndex
CREATE INDEX "UserLeaveBalance_workspaceId_idx" ON "UserLeaveBalance"("workspaceId");

-- CreateIndex
CREATE INDEX "UserLeaveBalance_year_idx" ON "UserLeaveBalance"("year");

-- CreateIndex
CREATE UNIQUE INDEX "UserLeaveBalance_userId_leaveTypeId_year_key" ON "UserLeaveBalance"("userId", "leaveTypeId", "year");

-- AddForeignKey
ALTER TABLE "UserGoogleToken" ADD CONSTRAINT "UserGoogleToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceLeavePolicy" ADD CONSTRAINT "WorkspaceLeavePolicy_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceLeavePolicy" ADD CONSTRAINT "WorkspaceLeavePolicy_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "WorkspaceLeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLeaveBalance" ADD CONSTRAINT "UserLeaveBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLeaveBalance" ADD CONSTRAINT "UserLeaveBalance_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLeaveBalance" ADD CONSTRAINT "UserLeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "WorkspaceLeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
