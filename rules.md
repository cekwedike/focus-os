# AI Coding Standards (Focus OS)

These rules govern all AI-assisted code generation for Focus OS in Cursor and similar tools. Human contributors should follow the same standards.

## Project Context

Focus OS is an Electron + React + TypeScript desktop app for freelancers. It uses better-sqlite3, Tailwind CSS, a deterministic hybrid allocation engine, and optional AI (OpenRouter/Ollama) for advisory Daily Insights only.

## File Size Limits

| Category | Max lines |
|----------|-----------|
| General source files | **1500** |
| Data-heavy modules (DB queries, large type maps, migration files) | **800** |

When approaching limits, split by responsibility: extract hooks, subcomponents, query modules, or pure functions into separate files. Do not pad files with blank lines to avoid splitting.

## Architecture Principles

### Component-First (Renderer)

- Build UI from small, focused React components.
- Screen-level components compose cards, lists, and forms; avoid monolithic page files.
- Shared UI lives in `src/renderer/components/`; route pages in `src/renderer/screens/`.

### DRY (Don't Repeat Yourself)

- Shared types in `src/shared/types/`.
- Pure scheduling logic in `src/shared/allocation/` (standalone, testable module).
- Database access centralized in `src/main/db/`; no copy-pasted SQL across handlers.
- IPC channel names and payloads defined once, consumed by main and preload.

### Separation of Concerns

- **Main process**: SQLite, timers, notifications, AI HTTP, native APIs.
- **Renderer**: Presentation and user interaction only via preload bridge.
- **Allocation engine**: Pure input/output; no React, no Electron imports.

## TypeScript

- **Strict mode always on** (`strict: true`, no implicit any).
- Prefer explicit interfaces for IPC payloads, DB row shapes, and allocation inputs/outputs.
- Use discriminated unions for block types, break types, insight sources.
- Avoid type assertions (`as`) unless narrowing is impossible and documented.

## Source of Truth: Allocation Engine

The hybrid allocation engine is the **authoritative** system for schedule generation and re-allocation.

- Daily Insight and all AI features are **advisory only**.
- AI must never auto-insert, delete, or reorder schedule blocks or tasks in the database.
- Any user-visible schedule change flows through explicit user action or documented engine rules (wake time, long break return, settings change).
- When implementing AI UI, read-only display and "suggested action" copy is allowed; one-click apply must still call the same engine paths as manual edits.

## State Management

- **Default**: React `useState`, `useReducer`, and **React Context** for cross-screen shared state (current day schedule, active client, settings cache).
- **No Redux** (or Zustand/MobX) unless a future phase proves Context prop-drilling is unmaintainable; justify in PROMPTS_LOG before introducing.
- Server-ish state (SQLite) lives in main process; renderer holds snapshots refreshed via IPC after mutations.
- Optimistic UI only where rollback on IPC failure is implemented.

## Naming Conventions

| Layer | Convention | Examples |
|-------|------------|----------|
| React components | PascalCase | `TaskMatrix`, `WakeTimeModal` |
| Functions, variables, hooks | camelCase | `calculateSchedule`, `useDailySchedule` |
| Constants (true constants) | UPPER_SNAKE or camelCase per file pattern | `MIN_BLOCK_MINUTES`, `defaultBufferPercent` |
| Database columns & tables | snake_case | `client_id`, `wake_time`, `breaks_log` |
| IPC channels | kebab or colon namespaced | `schedule:generate`, `db:tasks:list` |
| Files (components) | PascalCase.tsx | `SidebarNav.tsx` |
| Files (utilities) | camelCase or kebab-case matching folder | `allocationEngine.ts` |
| CSS/Tailwind | utility-first; semantic wrappers in components | `bg-accent`, `text-mint` |

## Comments and Documentation

- Prefer self-documenting names over comments.
- Comment **why** for non-obvious business rules (e.g. minimum viable block threshold, bump-to-next-day policy).
- Do **not** use horizontal rules (`---`) or em dashes in generated docs, comments, or commit messages.
- JSDoc on public exported functions in `shared/` and allocation engine; optional elsewhere.

## Code Generation Rules for AI

1. **Never truncate code** in responses or edits. Output complete files or complete named functions, not `// ... rest unchanged` unless the user explicitly asked for a partial diff and the tool requires it.
2. **Ask before assuming** when requirements are ambiguous, especially:
   - Allocation edge cases not covered in ALLOCATION_ENGINE.md
   - Schema changes or new columns
   - New external services or network endpoints
   - UX flows that affect protected blocks or client weights
3. **Minimize scope**: only change files required for the task; no drive-by refactors.
4. **Match existing style** in the file being edited.
5. **No placeholders**: avoid `TODO`, `FIXME`, or empty stub implementations unless the user requested a scaffold with explicit follow-up phase.

## Testing Expectations

- Allocation engine: unit tests for every documented step and re-allocation path.
- Pure utilities: test edge cases.
- Do not add trivial tests that only assert truthiness.

## Security Reminders for AI

- Never commit or hardcode `OPENROUTER_API_KEY`.
- Never log full API keys or prayer/journal body text at info level in production paths.
- See [SECURITY.md](./SECURITY.md) for data sent to AI providers.

## UI Standards

- Dark theme default; accent color `#2DD4A0` (mint green).
- Card-based layouts; consistent spacing scale via Tailwind.
- Sidebar + top status bar shell on all primary screens.
- Accessible: keyboard focus, labels on inputs, sufficient contrast on accent text.

## Dependencies

- Do not add new npm packages without user approval or roadmap phase need.
- Prefer built-in Node/Electron APIs where sufficient.

## Session Handoff

When completing significant work, AI should remind to update:

- [ROADMAP.md](./ROADMAP.md) phase status
- [PROMPTS_LOG.md](./PROMPTS_LOG.md) entry
- [CHANGELOG.md](./CHANGELOG.md) if user-visible

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ALLOCATION_ENGINE.md](./ALLOCATION_ENGINE.md)
- [SCHEMA.md](./SCHEMA.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
