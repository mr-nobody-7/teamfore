# Technical Document

## System overview

TeamFore is a pnpm monorepo containing:

- API service (`apps/api`): Express + TypeScript backend.
- Web application (`apps/web`): Next.js + TypeScript frontend.
- Shared workspace root tooling for build, lint, format, and type checks.

## Tech stack

### Workspace-level

- Package manager: pnpm `10.28.1`.
- Runtime baseline: Node.js 20+.
- Language: TypeScript.
- Formatting/linting: Biome.
- Git hooks: Husky (`pre-commit`, `pre-push`).

### Backend (`apps/api`)

- Framework: Express `5.x`.
- ORM + DB access: Prisma `7.x` + `@prisma/adapter-pg` + PostgreSQL (`pg`).
- Authentication: JWT (`jsonwebtoken`) + cookie-based session token.
- OAuth: `passport` + `passport-google-oauth20`.
- Validation: Zod.
- Security middleware: Helmet, CORS, rate limiting, compression.
- Email integration: Brevo SDK.

### Frontend (`apps/web`)

- Framework: Next.js `16.x` (App Router) + React `19.x`.
- Data fetching/cache: TanStack React Query.
- HTTP client: Axios.
- Forms: React Hook Form + Zod resolver.
- UI primitives: Radix-based components and utility classes.
- Analytics: PostHog.
- Notifications: Sonner toast.

## Monorepo structure

- `apps/api`: backend source, migrations, generated Prisma client.
- `apps/web`: frontend routes, components, hooks, services.
- `packages`: reserved for shared packages.
- Root scripts execute recursively with `pnpm -r`.

## Backend architecture details

### Layered design

- Routes:
	- Define endpoints and middleware composition.
- Controllers:
	- Parse inputs, call services, return response envelope.
- Services:
	- Business logic, authorization rules, Prisma operations.
- Middleware:
	- Auth, RBAC, validation, error handling, security controls.
- Utilities:
	- JWT helpers, response helpers, audit logger.

### Data model highlights

Core entities:

- Workspace, Team, User.
- LeaveRequest (session-aware leave periods).
- UserAvailabilityStatus and UserWorkloadStatus.
- PublicHoliday.
- AuditLog (append-only, resilient to user deletion).
- WorkspaceLeaveType settings.
- FeedbackEntry.

### Auth and session model

- JWT issued by API and stored in `httpOnly` cookie.
- Cookie policy:
	- production: `secure=true`, `sameSite=none`.
	- local dev: `secure=false`, `sameSite=strict`.
- OAuth callback URL supports relative path configuration:
	- `GOOGLE_CALLBACK_URL=/auth/google/callback`.
	- Allows one config to work in local and production domains.

### API response and error contract

- Success envelope:
	- `success`, `message`, `data`.
- Error envelope:
	- `success=false`, `message`.
- App-level errors map to meaningful status codes.
- Duplicate-email registration is mapped to HTTP `409` with informative message.

### Security controls

- CORS allowlist sourced from `CLIENT_URL` and `CLIENT_URLS`.
- Auth and API rate limiting.
- Helmet hardening headers.
- Payload size limits and input validation.

## Frontend architecture details

### Application structure

- App Router with separated route groups:
	- marketing pages.
	- auth pages.
	- dashboard pages.
- Provider chain in root layout:
	- PostHog provider.
	- Theme provider.
	- React Query provider.
	- Auth context provider.

### Data flow

- Axios instance uses:
	- local dev: direct API base URL.
	- production: `/api/*` path with Next.js rewrite to external backend.
- Auth failures (`401`) on private routes trigger redirect to login.
- React Query handles caching, stale-time management, and invalidation after mutations.

### Authorization model in UI

- Role-aware navigation and guard components control page visibility.
- Manager/admin-only flows include approvals and reports.
- Admin-only flows include users, teams, settings, and audit logs.

## Core functional flows

### Registration and onboarding

1. User submits registration.
2. Backend validates payload and checks email uniqueness.
3. Workspace and first user are created transactionally.
4. Leave type settings are initialized.
5. JWT cookie is issued for workspace onboarding flow.

### Leave apply and approval

1. User applies leave with date and session range.
2. Backend validates overlap and policy constraints.
3. Capacity warning is computed based on projected availability.
4. Manager/admin approves or rejects.
5. Frontend invalidates affected queries and refreshes views.

### Availability board

1. User updates daily status/workload.
2. Backend upserts status records by date.
3. Team board aggregates member state for selected date/team scope.

### Reporting

1. Frontend requests analytics with date/month filters.
2. Backend scopes data by workspace and role/team permissions.
3. UI renders charts and supports CSV export.

## Route surface (selected)

- Auth: `/auth/register`, `/auth/register-workspace`, `/auth/login`, `/auth/google`, `/auth/me`, `/auth/logout`.
- Leave: `/leave`, `/leave/applyLeave`, `/leave/:id/status`, `/leave/:id/cancel`.
- Reports: `/reports/summary`, `/reports/analytics`.
- Teams: `/teams` CRUD.
- Users: `/users` and profile/password updates.
- Availability: board and update endpoints.
- Holidays, settings, feedback, audit logs.
- Health: `/health`.

## Build, quality, and operations

### Root commands

- `pnpm dev`
- `pnpm build`
- `pnpm check`
- `pnpm lint`
- `pnpm format`
- `pnpm typecheck`

### Hook gates

- Pre-commit: format, check, typecheck.
- Pre-push: check, typecheck, build.

## Deployment architecture

Current production footprint:

- Web: Vercel.
- API: Railway.
- Database: Neon PostgreSQL.

Deployment behavior:

- Frontend uses `NEXT_PUBLIC_API_URL` for rewrite destination.
- Backend CORS allowlist must include deployed frontend domain.
- OAuth console must include exact local and production redirect URIs.

## Scalability and reliability considerations

- Pagination on large list endpoints.
- Role/workspace scoping at query level.
- Fire-and-forget audit logging to avoid request blocking.
- Centralized error handler for stable API error shape.
- Query cache strategy to reduce redundant API calls.

## Known implementation notes

- Leave overlap logic uses session-aware half-day slot modeling.
- Capacity heatmap derives daily capacity from leave occupancy and scoped member count.
- Public holidays include national/company/regional categories.
