import z from "zod";

export const registerSchema = z.object({
  workspace_name: z
    .string()
    .trim()
    .min(3, "Workspace name is required")
    .max(50, "Workspace name must be less than 50 characters"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const registerWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  workspaceName: z
    .string()
    .trim()
    .min(3, "Workspace name is required")
    .max(50, "Workspace name must be less than 50 characters"),
  leaveTypes: z
    .array(z.string().trim().min(1))
    .max(10, "At most 10 leave types are supported")
    .transform((types) => Array.from(new Set(types))),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const applyLeaveSchema = z.object({
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date",
  }),
  start_session: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"], {
    error: "Invalid start session",
  }),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date",
  }),
  end_session: z.enum(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"], {
    error: "Invalid end session",
  }),
  type: z
    .string()
    .trim()
    .min(1, "Leave type is required")
    .max(100, "Invalid leave type"),
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(500, "Reason must be less than 500 characters"),
});

export const listLeaveSchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"], {
      error: "Invalid status value",
    })
    .optional(),
  team_id: z.string().optional(),
  page: z.coerce
    .number({ error: "page must be a number" })
    .int("page must be an integer")
    .min(1, "page must be at least 1")
    .default(1),
  limit: z.coerce
    .number({ error: "limit must be a number" })
    .int("limit must be an integer")
    .min(1, "limit must be at least 1")
    .max(50, "limit must not exceed 50")
    .default(10),
});

export const updateLeaveStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    error: "Status must be APPROVED or REJECTED",
  }),
  comment: z
    .string()
    .max(500, "Comment must be less than 500 characters")
    .optional(),
});

export const availabilityBoardQuerySchema = z.object({
  date: z.string().date().optional(),
  team_id: z.string().optional(),
});

export const setMyAvailabilitySchema = z
  .object({
    status: z
      .enum([
        "AVAILABLE",
        "ON_LEAVE",
        "WORKING_REMOTELY",
        "HALF_DAY",
        "BUSY",
        "FOCUS_TIME",
      ])
      .optional(),
    workload: z.enum(["LIGHT", "NORMAL", "HEAVY"]).optional(),
    date: z.string().date().optional(),
  })
  .refine(
    (value) => value.status !== undefined || value.workload !== undefined,
    {
      message: "At least one of status or workload is required",
      path: ["status"],
    },
  );

export const listPublicHolidaysSchema = z
  .object({
    from: z.string().date().optional(),
    to: z.string().date().optional(),
    region: z
      .string()
      .trim()
      .min(2, "region must be at least 2 characters")
      .max(32, "region must be at most 32 characters")
      .optional(),
  })
  .refine(
    ({ from, to }) =>
      (from === undefined && to === undefined) ||
      (from !== undefined && to !== undefined),
    {
      message: "from and to must be provided together",
      path: ["from"],
    },
  )
  .refine(({ from, to }) => !from || !to || new Date(from) <= new Date(to), {
    message: "from must be before or equal to to",
    path: ["to"],
  });

export const reportsAnalyticsSchema = z
  .object({
    month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be in YYYY-MM format")
      .optional(),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
    team_id: z.string().optional(),
  })
  .refine(
    ({ from, to }) =>
      (from === undefined && to === undefined) ||
      (from !== undefined && to !== undefined),
    {
      message: "from and to must be provided together",
      path: ["from"],
    },
  )
  .refine(({ month, from, to }) => !(month && from && to), {
    message: "Provide either month or from/to range, not both",
    path: ["month"],
  })
  .refine(({ from, to }) => !from || !to || new Date(from) <= new Date(to), {
    message: "from must be before or equal to to",
    path: ["to"],
  });

export const updateLeaveTypesSchema = z.object({
  enabled_types: z
    .array(z.string().trim().min(1))
    .min(1, "At least one leave type must remain enabled"),
});

export const createLeaveTypeSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Label is required")
    .max(50, "Label must be less than 50 characters"),
});

export const updateLeaveTypeSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, "Label is required")
      .max(50, "Label must be less than 50 characters")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.label !== undefined || v.isActive !== undefined, {
    message: "At least one field (label or isActive) must be provided",
    path: ["label"],
  });

export const createFeedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Feedback message is required")
    .max(2000, "Feedback message must be less than 2000 characters"),
});

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name is required")
    .max(100, "Team name must be less than 100 characters"),
});

export const updateTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name is required")
    .max(100, "Team name must be less than 100 characters"),
});

export const listUsersSchema = z.object({
  role: z.enum(["USER", "MANAGER", "ADMIN"]).optional(),
  team_id: z.string().optional(),
  is_active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["USER", "MANAGER", "ADMIN"]),
  team_id: z.string().optional(),
});

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters")
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address")
      .optional(),
    role: z.enum(["USER", "MANAGER", "ADMIN"]).optional(),
    team_id: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const updateMyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
});

export const updateMyPasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(8, "Current password must be at least 8 characters long"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long"),
});

export const listAuditLogsSchema = z.object({
  action: z
    .enum([
      "USER_REGISTERED",
      "USER_LOGIN",
      "USER_LOGIN_FAILED",
      "USER_CREATED",
      "USER_UPDATED",
      "USER_DEACTIVATED",
      "TEAM_CREATED",
      "TEAM_UPDATED",
      "TEAM_DELETED",
      "LEAVE_TYPES_UPDATED",
      "USER_AVAILABILITY_UPDATED",
      "LEAVE_APPLIED",
      "LEAVE_APPROVED",
      "LEAVE_REJECTED",
      "LEAVE_CANCELLED",
    ])
    .optional(),
  user_id: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
