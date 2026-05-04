# TeamFore

TeamFore is a workspace-based leave and availability platform for teams.
It helps employees plan time off, helps managers make better approval decisions,
and gives admins visibility into operations with auditability.

## User guide

### Who should use TeamFore

- Users (employees): apply for leave, track request status, set daily availability/workload.
- Managers: review team leaves, approve/reject requests, monitor team planning risk.
- Admins: manage teams/users/settings, review analytics and audit logs.

### Main product features

- Authentication with email/password and Google OAuth.
- Workspace onboarding with custom leave type selection.
- Leave lifecycle management:
	- Apply leave with session granularity: `FULL_DAY`, `FIRST_HALF`, `SECOND_HALF`.
	- Approval lifecycle: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
	- Overlap prevention and status-based filtering.
- Smart capacity warning:
	- Warns when projected team capacity drops below threshold.
	- Configurable by `TEAM_MIN_CAPACITY_WARNING_PERCENT`.
- Calendar and planning:
	- Team leave calendar.
	- Public holiday overlay.
	- Capacity heatmap for planning risk.
- Availability and standup support:
	- Daily status: `AVAILABLE`, `ON_LEAVE`, `WORKING_REMOTELY`, `HALF_DAY`, `BUSY`, `FOCUS_TIME`.
	- Workload status: `LIGHT`, `NORMAL`, `HEAVY`.
	- Standup board for daily team visibility.
- Reports and governance:
	- Dashboard summaries.
	- Analytics with CSV export.
	- Audit logs for key actions.

### Typical user workflows

1. Register a workspace using email/password or Google.
2. Configure leave types (admin) and teams/users.
3. Team members apply for leave.
4. Managers/admins review approvals with capacity warnings.
5. Team uses calendar, standup board, and analytics for planning.

### Role-based navigation highlights

- User:
	- `My Leaves`, `Apply Leave`, `Calendar`, `Dashboard`.
- Manager:
	- `Team Leaves`, `Approvals`, `Reports`, `Calendar`.
- Admin:
	- `All Leaves`, `Teams`, `Users`, `Settings`, `Audit Logs`, `Reports`.

### Error and feedback behavior

- Validation and business errors are returned with user-friendly messages.
- Duplicate email registration now returns `Email already in use`.
- Auth/session issues on private pages redirect to login.

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Install dependencies

```bash
pnpm install
```

### Configure environment

API:

```bash
cp apps/api/.env.example apps/api/.env
```

Web:

```bash
cp apps/web/.env.example apps/web/.env.local
```

### Run locally

```bash
pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

### Quality commands

```bash
pnpm check
pnpm typecheck
pnpm build
pnpm format
```

## Environment variables

### API required (`apps/api`)

- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`

### API recommended/optional (`apps/api`)

- `PUBLIC_API_URL` (used by API docs/OpenAPI server URL)
- `CLIENT_URLS` (comma-separated allowed origins)
- `NODE_ENV`
- `PORT`
- `TEAM_MIN_CAPACITY_WARNING_PERCENT` (`0`-`100`, default `50`)

### Web required (`apps/web`)

- `BACKEND_URL`

### OAuth callback recommendation

Use relative callback path so one config works locally and in production:

- `GOOGLE_CALLBACK_URL=/auth/google/callback`

Then register both exact callback URLs in Google Console:

- `http://localhost:4000/auth/google/callback`
- `https://backend-production-4678.up.railway.app/auth/google/callback`

## Deployment notes

Current hosted setup:

- API: Railway (`https://backend-production-4678.up.railway.app`)
- Web: Vercel (`https://teamfore.vercel.app`)

Deployment checklist:

1. Deploy API and confirm `/health` is reachable.
2. Set web `BACKEND_URL` to the Railway API URL.
3. Optionally set API `PUBLIC_API_URL` to the same Railway URL for docs/OpenAPI.
4. Configure API `CLIENT_URL` to the web domain.
5. Ensure Google OAuth origins and redirect URIs include local and production URLs.
6. Redeploy both services after environment variable changes.

## Repository structure

- `apps/api`: Express + Prisma backend
- `apps/web`: Next.js frontend
- `packages`: shared packages (reserved)

## Documentation index

- [Product Overview](./PRODUCT_OVERVIEW.md)
- [Technical Document](./ARCHITECTURE.md)
- [Operations Guide](./OPERATIONS.md)

## License

Internal project / private workspace.
