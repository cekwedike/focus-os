# Development Guide

This document covers local environment setup, project structure, Electron process boundaries, SQLite initialization, and workflow notes for building Focus OS across multiple Cursor sessions.

## Prerequisites

| Requirement | Version / Notes |
|-------------|-----------------|
| Node.js | **v20 LTS** or later (`.nvmrc` or `engines` field to be added at scaffold) |
| Package manager | **npm** (default) or **pnpm**; pick one and stay consistent |
| Git | For version control |
| Windows | Primary target for packaged `.exe`; dev may run on macOS/Linux with platform-specific Electron builds |
| Ollama | Optional; install locally for offline Daily Insight testing |
| Cursor | Primary IDE with AI-assisted development |

## Initial Setup

```bash
git clone <repository-url>
cd focus-os
npm install
cp .env.example .env
```

Edit `.env` with optional OpenRouter credentials and Ollama settings. The app must run without AI configured; Daily Insight will degrade gracefully.

## Electron Development Workflow

Focus OS follows the standard Electron pattern: a **main process** (Node.js, privileged) and a **renderer process** (Chromium, React UI).

### Expected npm Scripts (at scaffold)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite/webpack dev server for renderer + Electron main with watch/reload |
| `npm run build` | Production build of renderer and main bundles |
| `npm run package:win` | electron-builder Windows artifact |
| `npm test` | Unit tests (allocation engine, utilities) |
| `npm run lint` | ESLint + TypeScript check |

### Dev Mode Flow

1. Main process entry (`src/main/index.ts`) creates the BrowserWindow and registers IPC handlers.
2. Renderer loads from dev server URL in development, from `file://` or bundled assets in production.
3. Preload script (`src/preload/index.ts`) exposes a typed `window.focusOS` API; renderer never imports Node or SQLite directly.
4. Hot reload applies to renderer; main process changes typically require an Electron restart.

### Debugging

- **Renderer**: Chromium DevTools (View > Toggle Developer Tools or `Ctrl+Shift+I`).
- **Main process**: Attach VS Code/Cursor debugger to Electron main, or use `console.log` piped to terminal running `npm run dev`.
- **SQLite**: Inspect `focus-os.db` in user data directory with DB Browser for SQLite during development.

## Folder Structure (Proposed)

Structure will be finalized at Phase 1 scaffold. Planned layout:

```
focus-os/
├── docs/                    # Optional: move long-form docs here later
├── src/
│   ├── main/                # Electron main process
│   │   ├── index.ts         # App entry, window lifecycle
│   │   ├── ipc/             # IPC handler registration
│   │   ├── db/              # SQLite init, migrations, queries
│   │   ├── services/        # Timers, notifications, AI routing
│   │   └── allocation/      # Re-export or thin wrapper around engine
│   ├── preload/
│   │   └── index.ts         # contextBridge API surface
│   ├── renderer/            # React application
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/      # Shared UI components
│   │   ├── screens/         # Route-level pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   └── styles/          # Tailwind entry, global CSS
│   └── shared/              # Types, constants, pure utilities
│       ├── types/
│       ├── allocation/      # Standalone allocation engine (testable)
│       └── constants/
├── tests/                   # Vitest/Jest unit tests
├── resources/               # Icons, installer assets
├── .env.example
├── electron-builder.yml     # Packaging config (Phase 12)
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.main.json
└── package.json
```

Update this section as directories are created. Keep ARCHITECTURE.md in sync when structure changes.

## Main vs Renderer Responsibilities

### Main Process

- Owns better-sqlite3 connection (native module; must not run in renderer).
- Runs allocation engine when persisting schedules (or validates renderer-submitted payloads).
- Schedules system notifications and micro-break timers.
- Runs staleness check intervals in background.
- Routes AI requests: OpenRouter HTTP, Ollama local HTTP, fallback chain.
- Stores and reads sensitive config (API keys from env or encrypted local store).

### Renderer Process

- All React UI: sidebar, top bar, screens, modals.
- Local UI state, form handling, optimistic updates where safe.
- Invokes main via preload IPC for every database read/write and privileged operation.
- Never holds OpenRouter API key in persistent renderer storage.

### IPC Pattern

- **Request/response**: `invoke('channel', payload)` returns Promise.
- **Events**: Main pushes `webContents.send('channel', payload)` for timers, break prompts, staleness alerts.
- Channels namespaced: `db:*`, `schedule:*`, `ai:*`, `notification:*`.
- Shared TypeScript types in `src/shared/types/ipc.ts` for both sides.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for module-level detail.

## SQLite Initialization

1. **Location**: User data path via `app.getPath('userData')`, e.g. `%APPDATA%/focus-os/focus-os.db` on Windows.
2. **Library**: better-sqlite3 in main process only.
3. **Bootstrap**: On first launch, run `schema.sql` or sequential migrations creating all 9 tables (see [SCHEMA.md](./SCHEMA.md)).
4. **WAL mode**: Enable `PRAGMA journal_mode = WAL` for concurrent read performance during long sessions.
5. **Migrations**: Version table `schema_migrations`; each phase that alters schema adds a numbered migration file in `src/main/db/migrations/`.
6. **Dev database**: Optional `FOCUS_OS_DB_PATH` env override for isolated test DB (document in `.env.example` when implemented).

```typescript
// Conceptual init flow (to be implemented)
// 1. Resolve db path
// 2. Open Database
// 3. Run pending migrations
// 4. Seed default app_settings if empty
// 5. Export singleton accessor for IPC handlers
```

## TypeScript Configuration

- **Strict mode** enabled project-wide (`strict: true`).
- Separate tsconfigs for main, preload, renderer if bundler requires it.
- Path aliases: `@shared/*`, `@renderer/*` for clean imports.

## 1000-Line File Limit

Focus OS enforces a **hard limit of 1000 lines per source file**. See [rules.md](./rules.md) for the full policy.

### Why This Exists

Large files are harder to review, test, and maintain across Cursor sessions. Splitting early keeps the allocation engine, IPC layer, and UI screens independently understandable.

### When to Split

| Signal | Action |
|--------|--------|
| File reaches ~800 lines | Plan the split before adding more code |
| Screen file grows complex | Extract presentational components to `components/` |
| Multiple unrelated exports | One primary export per file where practical |
| IPC handler file handles 3+ domains | Split into domain-specific handler modules |
| Allocation step logic exceeds one concern | Move to `steps/` subdirectory |

### How to Split (Examples)

**Renderer screen** (`DailyWorkspace.tsx` at 850 lines):

- Move wake-time modal to `components/WakeTimeModal.tsx`
- Move schedule preview card to `components/SchedulePreviewCard.tsx`
- Move data fetching to `hooks/useDailyWorkspace.ts`

**Main IPC** (`ipc/index.ts` registering everything):

- Split into `scheduleHandlers.ts`, `taskHandlers.ts`, `clientHandlers.ts`
- Keep `index.ts` as thin registration only (~50 lines)

**Allocation engine** (`allocateDay.ts` growing large):

- One file per pipeline step under `src/shared/allocation/steps/`
- `index.ts` orchestrates steps only

**DB layer** (`tasksRepository.ts` with many queries):

- Split read queries vs write queries, or split by feature area (matrix vs schedule fill)

Never split purely to game the line count (e.g. moving blank lines or imports alone). Each new file should have a clear single responsibility.

## Styling

- Tailwind CSS with custom theme tokens: dark background palette, accent `#2DD4A0`.
- Component-first: small presentational components in `components/`, screen composition in `screens/`.
- No CSS-in-JS unless a specific component requires it.

## Testing Strategy

- **Allocation engine**: Pure functions in `src/shared/allocation/`; full unit test coverage before UI integration (Phase 4).
- **DB layer**: Integration tests against in-memory or temp-file SQLite.
- **Renderer**: Component tests for critical flows (wake-time modal, break popup) as needed.
- Run `npm test` before marking roadmap phases complete.

## Working with Cursor Across Sessions

Focus OS is designed for multi-session AI-assisted development. Follow these practices:

### Before Starting a Session

1. Read [ROADMAP.md](./ROADMAP.md) for current phase and status.
2. Skim [PROMPTS_LOG.md](./PROMPTS_LOG.md) for recent decisions and context.
3. Open [rules.md](./rules.md) when prompting for code changes.
4. Reference [ALLOCATION_ENGINE.md](./ALLOCATION_ENGINE.md) and [SCHEMA.md](./SCHEMA.md) when touching scheduling or database code.

### During Development

- Scope prompts to **one roadmap phase** or sub-feature at a time.
- Ask Cursor to update ROADMAP phase status and append PROMPTS_LOG when a milestone completes.
- Never let AI auto-modify schedule logic based on Daily Insight output; enforce in code review.
- Keep every source file under 1000 lines; split modules at ~800 lines proactively.

### After a Session

- Commit with conventional messages (see [CONTRIBUTING.md](./CONTRIBUTING.md)).
- Update CHANGELOG `[Unreleased]` when user-visible behavior changes.
- Note blockers or deferred decisions in PROMPTS_LOG or ROADMAP.

### Useful Prompt Prefix

> "Focus OS project. Read rules.md and ARCHITECTURE.md. Current phase: [N]. Task: [description]. Do not change allocation engine behavior unless ALLOCATION_ENGINE.md is updated first."

## Dependency Notes

- **better-sqlite3**: Native rebuild required on Node/Electron version change; use `@electron/rebuild` in postinstall.
- **electron-builder**: Configured for Windows NSIS or portable target in Phase 12.
- Run `npm audit` periodically; see [SECURITY.md](./SECURITY.md).

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SCHEMA.md](./SCHEMA.md)
- [ALLOCATION_ENGINE.md](./ALLOCATION_ENGINE.md)
- [ROADMAP.md](./ROADMAP.md)
- [rules.md](./rules.md)
- [CI_CD.md](./CI_CD.md)
