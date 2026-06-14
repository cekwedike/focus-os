# Roadmap

12-phase build order for Focus OS from empty repository to packaged Windows executable. Update **Status** as work progresses: `Not Started`, `In Progress`, `Complete`.

Semantic version target for first release: **0.1.0** (see [CHANGELOG.md](./CHANGELOG.md)).

## Phase 1: Electron + React + TS + Tailwind Scaffold

**Status:** Not Started

**Goal:** Runnable desktop shell with navigation and routing only (no business logic).

**Deliverables**

- Electron + Vite + React + TypeScript project structure
- Tailwind configured with dark theme and mint accent `#2DD4A0`
- Sidebar routes: Dashboard, Daily Workspace, Task Matrix, Schedule, Daily Insight, Journal, Review, Settings
- Top status bar placeholder: time, streak badge, focus score, long-break button, notifications icon
- Preload skeleton and typed IPC stub
- `npm run dev` starts app; empty screen components per route

**Exit criteria:** App launches; navigation works; no database yet.

## Phase 2: SQLite Schema Setup

**Status:** Not Started

**Goal:** Persistent local database with all tables and migrations.

**Deliverables**

- better-sqlite3 in main process with `@electron/rebuild`
- Migrations for all 9 tables per [SCHEMA.md](./SCHEMA.md)
- Seed default protected_blocks and app_settings
- IPC: health check and simple read (e.g. list clients empty)

**Exit criteria:** DB file created in userData on first launch; schema version tracked.

## Phase 3: Settings Screen

**Status:** Not Started

**Goal:** Full CRUD for clients/projects and protected block configuration.

**Deliverables**

- Clients/projects: name, color, weight %, active, fixed block defaults
- Protected blocks: enable/disable, duration, anchor, reorder
- Global settings: buffer %, staleness default, notification toggles
- OpenRouter model and Ollama endpoint fields (key from env)
- Validation: weights warning if active sum not equal to 100

**Exit criteria:** User can create clients and configure day templates; data persists across restart.

## Phase 4: Allocation Engine (Standalone Module)

**Status:** Not Started

**Goal:** Testable pure module implementing [ALLOCATION_ENGINE.md](./ALLOCATION_ENGINE.md).

**Deliverables**

- `src/shared/allocation/` with full step pipeline and re-allocation
- Comprehensive unit tests (Vitest)
- Main process wrapper to map DB rows to engine types (no UI yet)

**Exit criteria:** All allocation tests pass; manual script or test fixture can print a day schedule.

## Phase 5: Daily Workspace + Wake-Time Flow

**Status:** Not Started

**Goal:** Morning wake-time capture and schedule generation with preview before lock-in.

**Deliverables**

- Wake-time modal on first open each calendar day
- Capacity input (remaining hours awareness)
- Allocation preview before user confirms and locks schedule
- `schedule:generate` IPC persists `daily_schedule` and `daily_settings` on confirm
- Daily Workspace shows current block summary and quick actions
- Regenerate schedule control (with confirm)

**Exit criteria:** User enters wake time, previews schedule, confirms; schedule rows appear in DB and UI reflects them.

## Phase 6: Schedule + Dashboard

**Status:** Not Started

**Goal:** Visual timeline and active session awareness.

**Deliverables**

- Schedule screen: card/timeline of blocks for today
- Dashboard: current/next block, progress through day
- Active block timer (planned vs elapsed)
- Mark block complete / skip with actual times written to DB
- Top bar wired to faith streak (placeholder until Phase 9) and focus score derived from adherence

**Exit criteria:** User can follow schedule visually and complete blocks with persisted actuals.

## Phase 7: Task Matrix

**Status:** Not Started

**Goal:** Central task management across clients.

**Deliverables**

- Task CRUD: title, client, priority, deadline, estimate, status
- Filters: client, status, priority, deadline
- Natural language quick-add (parse client name, priority hints, date phrases; fallback to manual form)
- Link tasks to schedule fill (engine uses tasks from Phase 4)

**Exit criteria:** Tasks created in UI appear in allocation output for new schedule generations.

## Phase 8: Breaks System

**Status:** Not Started

**Goal:** Micro-break popups and long break with re-allocation.

**Deliverables**

- Timer service: ~90 min micro-break trigger
- Micro-break modal: activity choices (read, walk, call, messages, doomscroll)
- Long break flow: reason, expected duration, pause state
- `schedule:reallocate` on return per allocation spec
- Day re-planned summary modal after long break
- `breaks_log` persistence
- Top bar long-break button wired

**Exit criteria:** Long break compresses afternoon client blocks; low-priority tasks bump; protected blocks intact; user sees re-plan summary.

## Phase 9: Journal (Faith Log)

**Status:** Not Started

**Goal:** Daily faith entries, streaks, and history.

**Deliverables**

- Journal screen: Bible reference + prayer notes for today
- Streak counter (consecutive days with entry)
- Searchable history list
- Stats panel: entries this month, longest streak, word count over time
- Top bar faith streak badge live

**Exit criteria:** Entries persist; streak survives app restart; search returns past entries.

## Phase 10: Review Screen

**Status:** Not Started

**Goal:** Retrospective analytics.

**Deliverables**

- Weekly view: planned vs actual hours per client (charts)
- Historical date range selector
- Break log analysis: frequency, duration, reasons (micro vs long)
- Export optional (CSV) if time permits

**Exit criteria:** Charts reflect DB actuals vs planned for selected range.

## Phase 11: Daily Insight (AI)

**Status:** Not Started

**Goal:** Advisory AI briefing with provider fallback.

**Deliverables**

- aiService: OpenRouter primary, Ollama fallback, source logged
- Prompt builder from daily snapshot (schedule, tasks, faith streak, yesterday variance)
- Daily Insight screen renders markdown; regenerate button
- Graceful degradation when neither provider available (raw data view)
- **No auto-schedule mutation**

**Exit criteria:** Insight generates with key configured; Ollama-only path works offline; failures degrade cleanly.

## Phase 12: Packaging (Windows exe)

**Status:** Not Started

**Goal:** Production build and installer.

**Deliverables**

- electron-builder config (icon, app id, Windows target)
- `npm run build` + `npm run package:win`
- Native module rebuild in CI/local documented
- Smoke test checklist on clean Windows machine
- Version 0.1.0 tag ready

**Exit criteria:** Installable or portable exe runs without dev tooling; DB and settings persist in userData.

## Phase Dependency Graph

```
1 Scaffold → 2 SQLite → 3 Settings
                ↓
         4 Allocation Engine
                ↓
    5 Wake/Workspace → 6 Schedule/Dashboard → 7 Tasks
                ↓
         8 Breaks → 9 Journal → 10 Review → 11 Insight → 12 Package
```

Phases 9 and 10 can partially parallelize after Phase 6; Phase 11 depends on data from 5-9.

## Tracking

When completing work in Cursor:

1. Set phase **Status** to `Complete` or `In Progress`.
2. Add note under phase with date and commit ref if helpful.
3. Append session summary to [PROMPTS_LOG.md](./PROMPTS_LOG.md).

## Related Documents

- [CHANGELOG.md](./CHANGELOG.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
