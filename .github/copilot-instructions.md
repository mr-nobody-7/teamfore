# TeamFore - AI Agent Instructions

## Project Overview

TeamFore is a pnpm-based monorepo workspace with two applications in active development:
- **apps/api**: Express.js REST API (Node.js + TypeScript)
- **apps/web**: Next.js web application (React + TypeScript)

## Tech Stack & Tooling

- **Package Manager**: pnpm v10.28.1 (required - enforced via packageManager field)
- **Language**: TypeScript (ES2022 target, NodeNext modules)
- **Linter/Formatter**: Biome v2.3.14+ (replaces ESLint/Prettier, configured at root)
- **Runtime**: Node.js with ES modules (`"type": "module"`)
- **Workspace**: pnpm monorepo with workspace protocol for internal dependencies

### Tech Stack by App
- **apps/api**: Express 5.x, tsx for dev mode, TypeScript compilation for production
- **apps/web**: Next.js with React (check package.json for version)

## Development Workflow

### Essential Commands
```bash
pnpm dev       # Run dev servers for all workspace packages
pnpm build     # Build all workspace packages
pnpm lint      # Lint all packages with Biome
pnpm format    # Format all packages with Biome
pnpm check     # Run checks across all packages
```

All commands use `pnpm -r` (recursive) to execute across workspace packages simultaneously.

### Package Manager Notes
- **Always use pnpm**, never npm or yarn (enforced by packageManager field)
- Install dependencies: `pnpm install` or `pnpm i` (run from root only)
- Add dependencies to a specific app: `cd apps/<app-name> && pnpm add <package>`
- Add workspace-level dev dependencies: `pnpm add -w <package>`
- **Critical**: Only ONE `pnpm-lock.yaml` at root - never create per-app lockfiles

## Code Quality

### Biome Configuration
- Single root-level [biome.json](biome.json) applies to entire monorepo
- Biome handles both linting and formatting (no ESLint, no Prettier)
- Configuration includes VCS integration with git
- Run `pnpm lint` to check all apps
- Run `pnpm format` to auto-format all code

## Project Structure

```
teamfore/
├── apps/
│   ├── api/          # Express API server
│   │   ├── src/
│   │   │   ├── app.ts      # Express app setup
│   │   │   └── server.ts   # Server entry point
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/          # Next.js web app
│       └── package.json
├── packages/         # Shared libraries (currently empty)
├── biome.json        # Root Biome config for entire monorepo
├── pnpm-workspace.yaml   # Defines workspace packages
├── pnpm-lock.yaml    # Single lockfile for entire workspace
└── package.json      # Root workspace config
```

## API Application (`apps/api`)

### Architecture
- Express 5.x with TypeScript
- ES modules (`"type": "module"`, `.js` extensions in imports)
- Separation: `app.ts` (Express setup) and `server.ts` (server bootstrap)
- Port: 4000

### Development Commands
```bash
cd apps/api
pnpm dev     # Run with tsx watch (hot reload)
pnpm build   # TypeScript compilation to dist/
pnpm start   # Run production build from dist/
```

### TypeScript Configuration
- Target: ES2022
- Module: NodeNext (requires `.js` extensions in imports)
- Output: `dist/` directory
- Source: `src/` directory

### Import Conventions
- **Always use `.js` extension** in imports: `import { app } from "./app.js"`
- This is required for NodeNext module resolution despite writing `.ts` files

## Web Application (`apps/web`)

### Architecture
- Next.js with React
- TypeScript enabled
- (Add more details as the app develops)

## Workspace Architecture Guidelines

### Adding New Packages
1. Create directory in `packages/` for shared libraries or `apps/` for applications
2. Each package must have its own `package.json` with standard scripts
3. Use workspace protocol for internal dependencies: `"@teamfore/<name>": "workspace:*"`

### Script Conventions
Every workspace package should implement these scripts:
- `dev`: Start development mode
- `build`: Production build
- `lint`: Run `biome check .`
- `format`: Run `biome format --write .`
- `check`: Type checking or other validation

This ensures root-level `pnpm -r <script>` commands work consistently.

## Common Patterns

### ES Modules
- All packages use `"type": "module"` in package.json
- Import statements must include file extensions (`.js` even for `.ts` files)
- No `require()` - use `import` instead

### TypeScript
- NodeNext module resolution across the board
- Strict mode enabled
- Each app has its own `tsconfig.json` tailored to its needs

### Code Style
- 2-space indentation
- Double quotes for strings
- Organize imports automatically (Biome assist enabled)
