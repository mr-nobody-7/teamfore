# TeamFore Project Audit (Comprehensive)
Generated: May 13, 2026
Scope: Full repository audit with implementation status, operating guidance, and roadmap

## 1) Executive Snapshot

TeamFore is a pnpm monorepo with:
- apps/api: Express 5 + TypeScript + Prisma (PostgreSQL), Node ESM
- apps/web: Next.js 16 + React 19 + TypeScript, TanStack Query

Current state:
- Backend is broad and mature: 11 route groups, 50 mounted endpoints, strong multi-tenant boundaries.
- Database design is mature: 14 active Prisma models, 8 enums, explicit support for leave accruals and Google Calendar tokens.
- Frontend product breadth is high: 18 route pages, 44 implemented component files, full dashboard workflow.
- Main incompleteness is frontend wiring quality in a few places (especially teams page and a users endpoint mismatch).

## 2) Backend API Surface (Current)

### 2.1 Mounted Route Groups in app.ts
- /auth
- /leave
- /availability
- /feedback
- /holidays
- /reports
- /settings
- /slack
- /teams
- /users
- /audit-logs

Additional app-level endpoints:
- GET /health
- GET /openapi.json
- GET /reference (Scalar docs)

### 2.2 Endpoint Catalog (Mounted)

Auth (/auth) - 11 endpoints:
- POST /register
- POST /register-workspace
- POST /login
- GET /google
- GET /google/calendar-connect
- GET /google/callback
- GET /google/failure
- GET /calendar-status
- POST /google/calendar-disconnect
- GET /me
- POST /logout

Leave (/leave) - 5 endpoints:
- POST /applyLeave
- GET /
- GET /export
- PATCH /:id/status
- PATCH /:id/cancel

Availability (/availability) - 2 endpoints:
- GET /board
- PUT /me

Feedback (/feedback) - 1 endpoint:
- POST /

Holidays (/holidays) - 1 endpoint:
- GET /

Reports (/reports) - 2 endpoints:
- GET /summary
- GET /analytics

Settings (/settings) - 10 endpoints:
- GET /leave-types
- PUT /leave-types
- POST /leave-types
- PATCH /leave-types/:id
- DELETE /leave-types/:id
- GET /countries
- POST /workspace
- GET /leave-balances (plan-gated)
- GET /leave-policies (admin + plan-gated)
- POST /leave-policies (admin + plan-gated)

Slack (/slack) - 7 endpoints:
- GET /oauth/install
- GET /oauth/callback
- GET /status
- DELETE /disconnect
- PATCH /settings
- POST /commands
- POST /actions

Teams (/teams) - 4 endpoints:
- GET /
- POST /
- PATCH /:id
- DELETE /:id

Users (/users) - 6 endpoints:
- PUT /me
- PUT /me/password
- GET /
- POST /
- PATCH /:id
- PATCH /:id/deactivate

Audit Logs (/audit-logs) - 1 endpoint:
- GET /

Totals:
- Mounted endpoints: 50
- App-level endpoints: 3
- Grand total externally available endpoints: 53

### 2.3 Security and Isolation Notes

Implemented and good:
- JWT auth + role middleware on sensitive routes
- Workspace scoping checks across services
- Plan gating middleware with TTL cache (requirePlan)
- CORS allowlist with CLIENT_URL / CLIENT_URLS
- Helmet, compression, API and auth rate limits
- Slack signature verification using raw body + HMAC
- Encrypted storage for sensitive tokens (Google and Slack)

## 3) Database and Domain Model (Prisma)

### 3.1 Schema Summary
- Models: 14
- Enums: 8
- Provider: PostgreSQL
- Prisma client output: apps/api/src/generated/prisma

### 3.2 Models (Active)

Core:
- Workspace
- User
- Team

Leave domain:
- LeaveRequest
- WorkspaceLeaveType
- WorkspaceLeavePolicy
- UserLeaveBalance

Availability/capacity:
- UserAvailabilityStatus
- UserWorkloadStatus

Calendar/holiday:
- PublicHoliday
- UserGoogleToken

Governance and integrations:
- AuditLog
- SlackInstallation
- FeedbackEntry

### 3.3 Notable Design Strengths
- Multi-tenant scoping centered on workspaceId
- Unique constraints on leave type keying and per-year per-user balances
- Indexes on date-heavy and reporting-heavy access patterns
- Audit log intentionally decoupled from FK constraints for immutability

## 4) Frontend Inventory and Product Surface

### 4.1 Route Pages

Marketing:
- /
- /(marketing)/changelog
- /(marketing)/privacy
- /(marketing)/terms

Auth:
- /(auth)/login
- /(auth)/register

Dashboard:
- /(dashboard)/dashboard
- /(dashboard)/calendar
- /(dashboard)/leaves
- /(dashboard)/leaves/apply
- /(dashboard)/leaves/approvals
- /(dashboard)/audit-logs
- /(dashboard)/teams
- /(dashboard)/users
- /(dashboard)/reports
- /(dashboard)/settings
- /(dashboard)/settings/profile
- /(dashboard)/settings/team

Totals:
- 18 page routes

### 4.2 Component Surface
- Component files in apps/web/components: 45 (44 implemented + 1 .gitkeep)
- Strong UI primitives and reusable calendar/dashboard components
- Dedicated providers for query/theme/posthog

### 4.3 Hooks and Client Services
- Hooks files: 12 (11 implemented + 1 .gitkeep)
- Core hooks include leaves, teams, reports analytics, dashboard summary, role/auth wrappers
- Client services: auth.service.ts, slack.service.ts

## 5) End-to-End Feature Status (As-Is)

### 5.1 Fully Implemented
- Workspace registration and onboarding (email/password + selected initial leave types)
- Google OAuth login
- Google Calendar connect/disconnect/status endpoints
- Leave application with:
  - half-day session handling
  - overlap detection at session slot granularity
  - capacity warning computation
  - holiday conflict surfacing
- Manager/admin leave approval and rejection
- CSV export (leaves + reports workflows)
- Audit logs (admin view)
- Dashboard summary analytics
- Reports analytics endpoint and dashboard charts
- Availability board + workload indicators
- Leave type management (built-in + custom, activation controls)
- Regional settings + holiday sync (async retry pattern)
- Slack integration:
  - OAuth install + status + settings + disconnect
  - slash commands (/whos-out, /my-leaves, /team-status, /apply-leave modal)
  - notifications and daily digest
- Leave accrual engine:
  - monthly/quarterly/annual accrual logic
  - cron jobs
  - carry-forward processing
  - leave balances APIs and admin policy APIs

### 5.2 Partial / Needs Completion

1. Teams page UX wiring is still largely presentational:
- create/update/delete mutations exist but are not bound to visible controls
- card stats and edit actions are mostly static placeholders

2. Users page endpoint inconsistency likely breaks some actions:
- list/create use /users
- update/deactivate use /user/:id and /user/:id/deactivate
- backend mounts /users/* (plural)

3. Settings page integration panel inconsistency:
- settings page shows static Slack “Connected” presentation card
- real Slack connect/config component exists elsewhere but is not the primary panel

4. Leave cancel behavior changed from older product docs:
- code allows only owner cancellation while PENDING
- older docs that claim approved-leave cancellation are now stale

5. Slack /apply-leave command has stale TODO comment:
- comment says LeaveBalance model missing
- model now exists (UserLeaveBalance)

### 5.3 Not Started / Low Coverage
- Mobile PWA installability (manifest/service-worker/offline strategy)
- Formal automated test suites (unit/integration/e2e) are still missing in repository

## 6) Integrations Status

### 6.1 Google Calendar

Implemented:
- OAuth scope includes calendar access
- token persistence in UserGoogleToken (encrypted)
- leave approval triggers event insertion
- leave rejection/cancellation triggers event removal
- event id persisted in LeaveRequest.googleCalendarEventId

Partially implemented / future-facing:
- helper exists for shared workspace calendar creation but is not wired to product flow
- no reconciliation/sync repair background job for drift scenarios

### 6.2 Slack

Implemented:
- OAuth, encrypted token storage, signature verification
- configurable digest and leave notifications
- DM decisions and channel notifications
- slash commands with command-level error handling

Potential improvements:
- stronger UX around slash command failures
- richer interactive workflows for approvals directly from Slack

### 6.3 Holidays

Implemented:
- country-based sync from nager.date
- upsert + stale holiday cleanup for yearly set
- async retry path when updating workspace regional settings

## 7) Environment and Configuration (Source-Verified)

### 7.1 Backend Variables Used in Source
- DATABASE_URL
- JWT_SECRET
- ENCRYPTION_KEY
- NODE_ENV
- PORT
- HOST
- CLIENT_URL
- CLIENT_URLS
- PUBLIC_API_URL (OpenAPI server URL resolution)
- API_URL (OpenAPI fallback)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- BREVO_API_KEY
- BREVO_SENDER_EMAIL
- BREVO_SENDER_NAME
- TEAM_MIN_CAPACITY_WARNING_PERCENT
- SLACK_CLIENT_ID
- SLACK_CLIENT_SECRET
- SLACK_SIGNING_SECRET
- SLACK_REDIRECT_URI

### 7.2 Frontend Variables Used in Source
- BACKEND_URL (Next rewrite target)
- NEXT_PUBLIC_API_URL (calendar connect redirect target)
- NEXT_PUBLIC_POSTHOG_KEY
- NEXT_PUBLIC_POSTHOG_HOST

## 8) Delivery Readiness and Risk Register

### 8.1 High Priority Risks
1. Users update/deactivate endpoint mismatch in frontend pathing.
2. Teams page perceived as complete visually but CRUD wiring incomplete.

### 8.2 Medium Priority Risks
1. Inconsistent Slack status presentation between pages/components.
2. Documentation drift (cancel semantics and old endpoint names).
3. No automated tests to guard regressions in leave/accrual logic.

### 8.3 Low Priority Risks
1. No PWA/offline support.
2. Google shared calendar orchestration not productized.

## 9) Forward Roadmap (Practical, Sequenced)

### Phase 1 - Correctness and Consistency (1-2 sprints)
1. Fix users page endpoint paths to /users/:id and /users/:id/deactivate.
2. Fully wire teams page create/edit/delete dialogs and actions.
3. Replace static Slack card with live SlackConnectCard consistently.
4. Update docs to reflect actual leave cancel policy (pending-only owner cancel).
5. Remove stale TODO in Slack command around leave balance model.

Definition of done:
- manual QA checklist passes for users, teams, settings integrations.
- no 404/405 on user management actions.

### Phase 2 - Reliability and Validation (2-4 sprints)
1. Add API integration tests for leave lifecycle and workspace isolation.
2. Add regression tests for accrual/carry-forward edge cases.
3. Add frontend e2e flows for apply -> approve -> calendar sync -> cancel.
4. Add monitoring hooks around cron outcomes and sync failure rates.

Definition of done:
- CI runs tests on every PR.
- failure alerts for scheduled jobs.

### Phase 3 - Product Maturity (2-3 sprints)
1. Implement PWA manifest + service worker + offline fallback strategy.
2. Productize shared workspace Google calendar strategy (optional admin flow).
3. Improve Slack interactive workflows (approval action blocks).
4. Add billing/plan management UX for currently “coming soon” actions.

Definition of done:
- installable web app support.
- documented integration playbooks.

## 10) Best Instructions for Future Contributors / Agents

Use this operational prompt context for future work:

Architecture rules:
1. Always preserve workspace isolation; never query/update cross-workspace data.
2. Keep NodeNext import style (.js extension in TS imports).
3. Use pnpm only; run from repo root unless intentionally scoped.

Verification checklist before merging:
1. pnpm -r check
2. pnpm -r --if-present typecheck
3. API smoke: auth, leave apply, approval, export, settings leave-types.
4. Web smoke: dashboard, leaves, apply, approvals, users, teams, settings.

Change hygiene:
1. Keep docs aligned with behavior changes (especially leave lifecycle semantics).
2. Update both PROJECT_AUDIT.md and CODEBASE_AUDIT.json when endpoint/model surface changes.
3. Prefer small logical commits grouped by feature domain.

## 11) Final Health Assessment

Overall: Mostly healthy and production-capable for core leave operations.

What is excellent now:
- broad feature coverage across leave management + integrations
- strong backend service layering and defensive checks
- good foundational schema for scaling policies and balances

What to fix next:
- teams/users frontend correctness and wiring gaps
- testing depth and long-term regression safety
- product consistency across settings integrations and docs

---

Audit completed: May 13, 2026
Audit type: source-verified code audit with roadmap guidance
