export interface RegisterInput {
  workspace_name: string;
  name: string;
  email: string;
  password: string;
}

export interface RegisterWorkspaceInput {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
  leaveTypes: LeaveTypeValue[];
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  workspaceId: string;
  teamId: string | null;
  createdAt: Date;
}

export interface RegisterResult {
  workspace: { id: string; name: string; createdAt: Date };
  user: SafeUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  workspaceId: string;
  role: string;
  teamId: string | null;
}

export interface ApplyLeaveInput {
  start_date: string;
  start_session: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
  end_date: string;
  end_session: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
  type: string;
  reason: string;
}

export interface ListLeaveQuery {
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | undefined;
  team_id?: string | undefined;
  page: number;
  limit: number;
}

export interface UpdateLeaveStatusInput {
  status: "APPROVED" | "REJECTED";
  comment?: string | undefined;
}

export interface LeaveCapacityWarning {
  teamId: string;
  teamName: string;
  teamSize: number;
  projectedOffCount: number;
  projectedAvailableCount: number;
  projectedCapacityPercent: number;
  shouldWarn: boolean;
  message: string;
}

export type AvailabilityStatusValue =
  | "AVAILABLE"
  | "ON_LEAVE"
  | "WORKING_REMOTELY"
  | "HALF_DAY"
  | "BUSY"
  | "FOCUS_TIME";

export type WorkloadLevelValue = "LIGHT" | "NORMAL" | "HEAVY";

export interface AvailabilityBoardQuery {
  date?: string | undefined;
  team_id?: string | undefined;
}

export interface SetMyAvailabilityInput {
  status?: AvailabilityStatusValue | undefined;
  workload?: WorkloadLevelValue | undefined;
  date?: string | undefined;
}

export type HolidayCategoryValue = "COMPANY" | "NATIONAL" | "REGIONAL";

export interface ListPublicHolidaysQuery {
  from?: string | undefined;
  to?: string | undefined;
  region?: string | undefined;
}

export interface ReportsAnalyticsQuery {
  month?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  team_id?: string | undefined;
}

export type LeaveTypeValue = string;

export interface UpdateLeaveTypesInput {
  enabled_types: string[];
}

export interface CreateLeaveTypeInput {
  label: string;
}

export interface UpdateLeaveTypeInput {
  label?: string;
  isActive?: boolean;
}

export interface UpdateWorkspaceRegionalSettingsInput {
  country?: string;
  timezone: string;
}

export interface CreateFeedbackInput {
  message: string;
}

export interface CreateTeamInput {
  name: string;
}

export interface UpdateTeamInput {
  name: string;
}

export interface ListUsersQuery {
  role?: "USER" | "MANAGER" | "ADMIN" | undefined;
  team_id?: string | undefined;
  is_active?: boolean | undefined;
  page: number;
  limit: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: "USER" | "MANAGER" | "ADMIN";
  team_id?: string | undefined;
}

export interface UpdateUserInput {
  name?: string | undefined;
  email?: string | undefined;
  role?: "USER" | "MANAGER" | "ADMIN" | undefined;
  team_id?: string | undefined;
  is_active?: boolean | undefined;
}

export interface UpdateMyProfileInput {
  name: string;
}

export interface UpdateMyPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ListAuditLogsQuery {
  action?:
    | "USER_REGISTERED"
    | "USER_LOGIN"
    | "USER_LOGIN_FAILED"
    | "USER_CREATED"
    | "USER_UPDATED"
    | "USER_DEACTIVATED"
    | "TEAM_CREATED"
    | "TEAM_UPDATED"
    | "TEAM_DELETED"
    | "LEAVE_TYPES_UPDATED"
    | "USER_AVAILABILITY_UPDATED"
    | "LEAVE_APPLIED"
    | "LEAVE_APPROVED"
    | "LEAVE_REJECTED"
    | "LEAVE_CANCELLED"
    | undefined;
  user_id?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  page: number;
  limit: number;
}
