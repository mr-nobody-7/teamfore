# Operations Guide

## Runtime endpoints (default local)

- API health: `GET /health`
- API base: `http://localhost:4000`
- Web app: `http://localhost:3000`

## Important operational settings

- `NODE_ENV`: environment mode
- `PORT`: API port
- `BACKEND_URL`: web-side backend base URL for Next.js rewrites
- `CLIENT_URL`: CORS origin for web client
- `TEAM_MIN_CAPACITY_WARNING_PERCENT`: warning trigger threshold (`0`–`100`, default `50`)

## Capacity warning threshold behavior

- Lower values produce fewer warnings (requires larger capacity drop)
- Higher values produce earlier warnings
- Values outside range are clamped to `0`–`100`

## Troubleshooting checklist

1. Ensure dependencies are installed with `pnpm install`.
2. Confirm API env values in `apps/api/.env`.
3. Run `pnpm -C apps/api build` to validate backend compile.
4. Run `pnpm -C apps/web exec tsc --noEmit` for frontend type checks.
5. Check API health endpoint and browser network calls.

## Change management

- Prefer focused commits by concern (API, UI, docs)
- Run targeted checks before push
- Keep `.env.example` synchronized with newly introduced env vars
