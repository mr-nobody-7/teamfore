-- Add label and isCustom columns to WorkspaceLeaveType
ALTER TABLE "WorkspaceLeaveType" ADD COLUMN "isCustom" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkspaceLeaveType" ADD COLUMN "label" TEXT NOT NULL DEFAULT '';

-- Populate label from existing built-in enum values
UPDATE "WorkspaceLeaveType" SET "label" = CASE
  WHEN type::text = 'VACATION' THEN 'Earned Leave'
  WHEN type::text = 'SICK'     THEN 'Sick Leave'
  WHEN type::text = 'PERSONAL' THEN 'Comp Off'
  WHEN type::text = 'CASUAL'   THEN 'Casual Leave'
  ELSE type::text
END;

-- Change LeaveRequest.type from LeaveType enum to plain text
ALTER TABLE "LeaveRequest" ALTER COLUMN "type" TYPE TEXT;

-- Change WorkspaceLeaveType.type from LeaveType enum to plain text
ALTER TABLE "WorkspaceLeaveType" ALTER COLUMN "type" TYPE TEXT;

-- Drop the now-unused LeaveType enum
DROP TYPE IF EXISTS "LeaveType";
