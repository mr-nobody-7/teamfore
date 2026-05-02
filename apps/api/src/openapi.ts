/**
 * OpenAPI 3.1 specification for the Team Pulse API.
 * Mounted at GET /openapi.json and rendered via Scalar at GET /reference.
 */
export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Team Pulse API",
    version: "1.0.0",
    description:
      "REST API for Team Pulse — a team leave and availability management platform. All authenticated endpoints require a valid `token` cookie set after login.",
    contact: {
      name: "Team Pulse",
      email: "vivekanandagodi@gmail.com",
    },
  },
  servers: [
    {
      url: process.env.API_URL ?? "http://localhost:4000",
      description: "API server",
    },
  ],
  tags: [
    { name: "Health", description: "Server health check" },
    { name: "Auth", description: "Authentication & session management" },
    { name: "Users", description: "User management (admin)" },
    { name: "Leave", description: "Leave requests & approvals" },
    { name: "Availability", description: "Team availability status board" },
    { name: "Feedback", description: "Workload / feedback entries" },
    { name: "Holidays", description: "Public holiday calendar" },
    { name: "Reports", description: "Leave analytics & summaries" },
    { name: "Settings", description: "Workspace-level settings" },
    { name: "Teams", description: "Team management" },
    { name: "Audit Logs", description: "Admin audit trail" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "JWT token stored in an HttpOnly cookie. Set automatically after login.",
      },
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
      UserRole: {
        type: "string",
        enum: ["ADMIN", "MANAGER", "USER"],
      },
      LeaveStatus: {
        type: "string",
        enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      },
      LeaveType: {
        type: "string",
        enum: ["ANNUAL", "SICK", "MATERNITY", "PATERNITY", "UNPAID", "OTHER"],
      },
      AvailabilityStatus: {
        type: "string",
        enum: ["AVAILABLE", "BUSY", "AWAY", "ON_LEAVE"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/UserRole" },
          isActive: { type: "boolean" },
          teamId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      LeaveRequest: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          type: { $ref: "#/components/schemas/LeaveType" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          reason: { type: "string", nullable: true },
          status: { $ref: "#/components/schemas/LeaveStatus" },
          createdAt: { type: "string", format: "date-time" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      Team: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          managerId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          action: { type: "string" },
          actorId: { type: "string" },
          targetId: { type: "string", nullable: true },
          meta: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Not authenticated",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { success: false, message: "Unauthorized" },
          },
        },
      },
      Forbidden: {
        description: "Insufficient permissions",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { success: false, message: "Forbidden" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { success: false, message: "Not found" },
          },
        },
      },
      ValidationError: {
        description: "Request validation failed",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
  paths: {
    // ─── Health ─────────────────────────────────────────────────────
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        operationId: "healthCheck",
        responses: {
          "200": {
            description: "API is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "API running 🚀" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ─── Auth ────────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register first admin user",
        description:
          "Creates the first ADMIN user for a new workspace. Only works when no admin exists yet.",
        operationId: "register",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Alice Admin" },
                  email: { type: "string", format: "email", example: "alice@acme.com" },
                  password: { type: "string", minLength: 8, example: "S3cur3P@ss" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Admin registered successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { user: { $ref: "#/components/schemas/User" } },
                    },
                  ],
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/auth/register-workspace": {
      post: {
        tags: ["Auth"],
        summary: "Register a new workspace (admin creates org)",
        operationId: "registerWorkspace",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "workspaceName"],
                properties: {
                  name: { type: "string", example: "Alice Admin" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  workspaceName: { type: "string", example: "Acme Corp" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Workspace registered",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email & password",
        operationId: "login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "alice@acme.com" },
                  password: { type: "string", example: "S3cur3P@ss" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful. Sets `token` cookie.",
            headers: {
              "Set-Cookie": {
                schema: { type: "string" },
                description: "HttpOnly JWT cookie",
              },
            },
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { user: { $ref: "#/components/schemas/User" } },
                    },
                  ],
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        operationId: "getMe",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Current user profile",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { user: { $ref: "#/components/schemas/User" } },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout and clear session cookie",
        operationId: "logout",
        responses: {
          "200": {
            description: "Logged out successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } },
            },
          },
        },
      },
    },

    // ─── Users ───────────────────────────────────────────────────────
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List all users (Admin)",
        operationId: "listUsers",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        users: { type: "array", items: { $ref: "#/components/schemas/User" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create a user (Admin)",
        operationId: "createUser",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "role"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  role: { $ref: "#/components/schemas/UserRole" },
                  teamId: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { user: { $ref: "#/components/schemas/User" } },
                    },
                  ],
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/users/me": {
      put: {
        tags: ["Users"],
        summary: "Update my profile",
        operationId: "updateMyProfile",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Profile updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { user: { $ref: "#/components/schemas/User" } },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/users/me/password": {
      put: {
        tags: ["Users"],
        summary: "Change my password",
        operationId: "updateMyPassword",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Password changed",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/users/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Update a user (Admin)",
        operationId: "updateUser",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { $ref: "#/components/schemas/UserRole" },
                  teamId: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { user: { $ref: "#/components/schemas/User" } },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/users/{id}/deactivate": {
      patch: {
        tags: ["Users"],
        summary: "Deactivate a user (Admin)",
        operationId: "deactivateUser",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "User deactivated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ─── Leave ───────────────────────────────────────────────────────
    "/leave": {
      get: {
        tags: ["Leave"],
        summary: "List leave requests",
        description:
          "Returns leave requests visible to the current user. Admins/Managers see all; Users see their own.",
        operationId: "listLeaves",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { $ref: "#/components/schemas/LeaveStatus" },
            description: "Filter by status",
          },
          {
            name: "type",
            in: "query",
            schema: { $ref: "#/components/schemas/LeaveType" },
            description: "Filter by leave type",
          },
        ],
        responses: {
          "200": {
            description: "List of leave requests",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        leaves: {
                          type: "array",
                          items: { $ref: "#/components/schemas/LeaveRequest" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/leave/applyLeave": {
      post: {
        tags: ["Leave"],
        summary: "Apply for leave",
        operationId: "applyLeave",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "startDate", "endDate"],
                properties: {
                  type: { $ref: "#/components/schemas/LeaveType" },
                  startDate: { type: "string", format: "date", example: "2026-06-01" },
                  endDate: { type: "string", format: "date", example: "2026-06-05" },
                  reason: { type: "string", example: "Family vacation" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Leave request created",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { leave: { $ref: "#/components/schemas/LeaveRequest" } },
                    },
                  ],
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/leave/{id}/status": {
      patch: {
        tags: ["Leave"],
        summary: "Approve or reject a leave request (Manager/Admin)",
        operationId: "updateLeaveStatus",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["APPROVED", "REJECTED"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Status updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { leave: { $ref: "#/components/schemas/LeaveRequest" } },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/leave/{id}/cancel": {
      patch: {
        tags: ["Leave"],
        summary: "Cancel a leave request",
        operationId: "cancelLeave",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Leave cancelled",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { leave: { $ref: "#/components/schemas/LeaveRequest" } },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ─── Availability ────────────────────────────────────────────────
    "/availability/board": {
      get: {
        tags: ["Availability"],
        summary: "Get team availability board",
        operationId: "getAvailabilityBoard",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Availability board for all team members",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        board: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              userId: { type: "string" },
                              name: { type: "string" },
                              status: { $ref: "#/components/schemas/AvailabilityStatus" },
                              note: { type: "string", nullable: true },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/availability/me": {
      put: {
        tags: ["Availability"],
        summary: "Set my availability status",
        operationId: "setMyAvailability",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { $ref: "#/components/schemas/AvailabilityStatus" },
                  note: { type: "string", example: "Working from home" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Availability updated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // ─── Feedback ────────────────────────────────────────────────────
    "/feedback": {
      post: {
        tags: ["Feedback"],
        summary: "Submit a workload / feedback entry",
        operationId: "createFeedback",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["workloadRating"],
                properties: {
                  workloadRating: {
                    type: "integer",
                    minimum: 1,
                    maximum: 5,
                    example: 3,
                    description: "1 = very low workload, 5 = overloaded",
                  },
                  note: { type: "string", example: "Sprint was a bit hectic" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Feedback recorded",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // ─── Holidays ────────────────────────────────────────────────────
    "/holidays": {
      get: {
        tags: ["Holidays"],
        summary: "List public holidays",
        operationId: "listPublicHolidays",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "year",
            in: "query",
            schema: { type: "integer", example: 2026 },
            description: "Year to fetch holidays for (defaults to current year)",
          },
        ],
        responses: {
          "200": {
            description: "Public holidays list",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        holidays: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              date: { type: "string", format: "date" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // ─── Reports ─────────────────────────────────────────────────────
    "/reports/summary": {
      get: {
        tags: ["Reports"],
        summary: "Get leave summary for current user",
        operationId: "getReportsSummary",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Leave summary",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        summary: {
                          type: "object",
                          properties: {
                            totalUsed: { type: "integer" },
                            totalApproved: { type: "integer" },
                            totalPending: { type: "integer" },
                            byType: { type: "object" },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/reports/analytics": {
      get: {
        tags: ["Reports"],
        summary: "Get team analytics (Manager/Admin)",
        operationId: "getReportsAnalytics",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "year",
            in: "query",
            schema: { type: "integer", example: 2026 },
          },
          {
            name: "teamId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by team (Admin only)",
          },
        ],
        responses: {
          "200": {
            description: "Analytics data",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { analytics: { type: "object" } },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    // ─── Settings ────────────────────────────────────────────────────
    "/settings/leave-types": {
      get: {
        tags: ["Settings"],
        summary: "Get leave type settings",
        operationId: "getLeaveTypesSettings",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Leave type configuration",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        leaveTypes: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              type: { $ref: "#/components/schemas/LeaveType" },
                              maxDaysPerYear: { type: "integer" },
                              requiresApproval: { type: "boolean" },
                              isEnabled: { type: "boolean" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      put: {
        tags: ["Settings"],
        summary: "Update leave type settings (Admin)",
        operationId: "updateLeaveTypesSettings",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  leaveTypes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { $ref: "#/components/schemas/LeaveType" },
                        maxDaysPerYear: { type: "integer" },
                        requiresApproval: { type: "boolean" },
                        isEnabled: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Settings updated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    // ─── Teams ───────────────────────────────────────────────────────
    "/teams": {
      get: {
        tags: ["Teams"],
        summary: "List teams",
        operationId: "listTeams",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "All teams",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        teams: { type: "array", items: { $ref: "#/components/schemas/Team" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Teams"],
        summary: "Create a team (Admin)",
        operationId: "createTeam",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Engineering" },
                  managerId: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Team created",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { team: { $ref: "#/components/schemas/Team" } },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/teams/{id}": {
      patch: {
        tags: ["Teams"],
        summary: "Update a team (Admin)",
        operationId: "updateTeam",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  managerId: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Team updated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: { team: { $ref: "#/components/schemas/Team" } },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Teams"],
        summary: "Delete a team (Admin)",
        operationId: "deleteTeam",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Team deleted",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ─── Audit Logs ──────────────────────────────────────────────────
    "/audit-logs": {
      get: {
        tags: ["Audit Logs"],
        summary: "List audit logs (Admin)",
        operationId: "listAuditLogs",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
          },
          {
            name: "action",
            in: "query",
            schema: { type: "string" },
            description: "Filter by action type",
          },
        ],
        responses: {
          "200": {
            description: "Paginated audit logs",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        logs: {
                          type: "array",
                          items: { $ref: "#/components/schemas/AuditLog" },
                        },
                        total: { type: "integer" },
                        page: { type: "integer" },
                        limit: { type: "integer" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
  },
} as const;
