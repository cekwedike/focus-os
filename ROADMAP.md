# Roadmap

12-phase build order for Focus OS from empty repository to packaged Windows executable. Update **Status** as work progresses: `Not Started`, `In Progress`, `Complete`.

Semantic version target for first release: **0.1.0** (see [CHANGELOG.md](./CHANGELOG.md)).

## Phase 1: Electron + React + TS + Tailwind Scaffold

**Status:** Complete

**Goal:** Runnable desktop shell with navigation and routing only (no business logic).

**Deliverables**

- Electron + Vite + React + TypeScript project structure
- Tailwind configured with dark theme and mint accent `#2DD4A0`
- Sidebar routes: Dashboard, Daily Workspace, Task Matrix, Schedule, Daily Insight, Journal, Review, Settings
- Top status bar placeholder: time, streak badge, focus score, long-break button, notifications icon
- Preload skeleton and typed IPC stub
- `npm run dev` starts app; empty screen components per route

**Exit criteria:** App launches; navigation works; no database yet.

**Completed 2026-06-14:** electron-vite scaffold, design tokens, AppShell with sidebar and top bar, HashRouter across 8 placeholder screens, preload `window.focusOS` bridge with `app:ping`, npm scripts for CI (`typecheck`, `lint`, `test`, `build`, `build:exe`).

## Phase 2: SQLite Schema Setup

**Status:** Complete

**Goal:** Persistent local database with all tables and migrations.

**Deliverables**

- better-sqlite3 in main process with `electron-builder install-app-deps` postinstall rebuild
- Migrations for all 9 tables per [SCHEMA.md](./SCHEMA.md)
- Seed default protected_blocks and app_settings
- IPC: `db:health`, clients/projects CRUD, protected_blocks CRUD

**Exit criteria:** DB file created in userData on first launch; schema version tracked.

**Completed 2026-06-14:** Versioned migration runner, initial schema migration, seed data for 5 protected block types and app_settings defaults, repositories and IPC handlers for clients and protected blocks, Vitest migration tests. Package manager switched to pnpm with hoisted node linker.

## Phase 3: Settings Screen

**Status:** Complete

**Goal:** Full CRUD for clients/projects and protected block configuration.

**Deliverables**

- Clients/projects: name, color, weight %, active, fixed block defaults
- Protected blocks: enable/disable, duration, anchor, reorder
- Global settings: buffer %, staleness default, notification toggles
- OpenRouter model and Ollama endpoint fields (key from env)
- Validation: weights warning if active sum not equal to 100

**Exit criteria:** User can create clients and configure day templates; data persists across restart.

**Completed 2026-06-14:** Full Settings screen with clients/projects CRUD (soft deactivate), protected blocks editor, app_settings IPC (`settings:get`, `settings:update`), OpenRouter key in userData `secrets.json` with masked UI, scheduling defaults and notification prefs. Migration 002 adds `default_buffer_percent` and `doomscroll_allowance_minutes`.

## Phase 4: Allocation Engine (Standalone Module)

**Status:** Complete

**Goal:** Testable pure module implementing [ALLOCATION_ENGINE.md](./ALLOCATION_ENGINE.md).

**Deliverables**

- `src/shared/allocation/` with full step pipeline and re-allocation
- Comprehensive unit tests (Vitest)
- Main process wrapper to map DB rows to engine types (no UI yet)

**Exit criteria:** All allocation tests pass; manual script or test fixture can print a day schedule.

**Completed 2026-06-14:** Pure allocation module with protected/fixed/buffer/weighted/task-fill pipeline, long-break re-allocation with MVB bumping and replan summary, 17 allocation unit tests, `runAllocation.ts` DB mapper in main process.

**Completed 2026-06-15:** Capacity-aware buffer sizing fix. Buffer is now percent of flexible time (`capacityMinutes - protected - fixed`), capped by `max_buffer_minutes` (default 60), with Settings UI guidance for high buffer values.

## Phase 5: Daily Workspace + Wake-Time Flow

**Status:** Complete

**Goal:** Morning wake-time capture and schedule generation with preview before lock-in.

**Deliverables**

- Wake-time modal on first open each calendar day
- Capacity input (remaining hours awareness)
- Allocation preview before user confirms and locks schedule
- `schedule:generate` IPC persists `daily_schedule` and `daily_settings` on confirm
- Daily Workspace shows current block summary and quick actions
- Regenerate schedule control (with confirm)

**Exit criteria:** User enters wake time, previews schedule, confirms; schedule rows appear in DB and UI reflects them.

**Completed 2026-06-14:** Wake-time modal, Daily Workspace with day parameters, fixed-block overrides, Auto-Assign preview via `schedule:generate`, confirm via `schedule:commit`, `daily:get`/`daily:upsert` IPC, migration 005 system unassigned client. Built after Phase 7 so allocation has real tasks.

## Phase 6: Schedule + Dashboard

**Status:** Complete

**Goal:** Visual timeline and active session awareness.

**Deliverables**

- Schedule screen: card/timeline of blocks for today
- Dashboard: current/next block, progress through day
- Active block timer (planned vs elapsed)
- Mark block complete / skip with actual times written to DB
- Top bar wired to live Faith Streak and focus score derived from adherence

**Exit criteria:** User can follow schedule visually and complete blocks with persisted actuals.

**Completed 2026-06-14:** Schedule timeline with start/pause/complete and edit-times control (drag-and-drop deferred). Dashboard cards for Right Now, Up Next, Focus Score, Until Next Break, Staleness Alerts. `ScheduleContext` and wired TopStatusBar. Block actions via `schedule:start-block`, `schedule:complete-block`, `schedule:update-block`.

## Phase 7: Task Matrix

**Status:** Complete

**Goal:** Central task management across clients.

**Deliverables**

- Task CRUD: title, client, priority, deadline, estimate, status
- Filters: client, status, priority, deadline
- Natural language quick-add (parse client name, priority hints, date phrases; fallback to manual form)
- Link tasks to schedule fill (engine uses tasks from Phase 4)

**Exit criteria:** Tasks created in UI appear in allocation output for new schedule generations.

**Completed 2026-06-14:** Full tasks IPC CRUD, Task Matrix screen with All Jobs / High / Recent filters (Recent = 48h), quick-add parser in `src/shared/parsing/quickAddTask.ts`, task cards with edit/complete/delete. Built first in combined milestone (7 → 5 → 6 → 8).

## Phase 8: Breaks System

**Status:** Complete

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

**Completed 2026-06-14:** `timerService` tracks accumulated active-block time; micro-break modal; long break modal with End Break → `schedule:reallocate`; `breaks_log` CRUD; `stalenessService` alerts; Replan Summary modal.

**Notification infrastructure (2026-06-15):** Micro-breaks, check-in due banners, block progression warnings, staleness alerts, and faith reminders now route through the centralized `notify()` service (see ARCHITECTURE.md Notification System). Depends on Phase 13 chat delivery pipeline for in-app messages.

## Phase 9: Journal (Faith Log)

**Status:** Complete

**Goal:** Daily faith entries, streaks, and history.

**Deliverables**

- Journal screen: Bible reference + prayer notes for today
- Streak counter (consecutive days with entry)
- Searchable history list
- Stats panel: entries this month, longest streak, word count over time
- Top bar Faith Streak badge live

**Exit criteria:** Entries persist; streak survives app restart; search returns past entries.

**Completed 2026-06-14:** `faithLogRepository`, `journalService`, `journalHandlers`, `calculateFaithStreaks`, Journal screen with history search, `FaithEntryModal` for schedule faith blocks via `journal:complete-faith-block`, live streak in Dashboard and top bar.

## Phase 10: Review Screen

**Status:** Complete

**Goal:** Retrospective analytics.

**Deliverables**

- Weekly view: planned vs actual hours per client (charts)
- Historical date range selector
- Break log analysis: frequency, duration, reasons (micro vs long)
- Export optional (CSV) if time permits

**Exit criteria:** Charts reflect DB actuals vs planned for selected range.

**Completed 2026-06-14:** Pure review aggregators in `src/shared/review/`, `reviewRepository`, `reviewService`, Review screen with CSS flex bar charts (no new chart library), date range presets, protected block day summaries, task completion rate.

## Phase 11: Daily Insight (AI)

**Status:** Complete

**Goal:** Advisory AI briefing with provider fallback.

**Deliverables**

- aiService: OpenRouter primary, Ollama fallback, source logged
- Prompt builder from daily snapshot (schedule, tasks, Faith Streak, yesterday variance)
- Daily Insight screen renders markdown; regenerate button
- Graceful degradation when neither provider available (raw data view)
- **No auto-schedule mutation**

**Exit criteria:** Insight generates with key configured; Ollama-only path works offline; failures degrade cleanly.

**Completed 2026-06-14:** `buildDailySnapshot`, `aiService` with OpenRouter/Ollama routing, `insightsLogRepository`, IPC (`insights:generate`, `insights:get-today`, `insights:list`), Daily Insight screen with auto-generate on open, `settings:test-ai-providers`.

## Phase 12: Packaging (Windows exe)

**Status:** Complete

**Goal:** Production build and installer.

**Deliverables**

- electron-builder config (icon, app id, Windows target)
- `npm run build` + `npm run package:win` (and `npm run build:exe` alias for CI)
- Native module rebuild in CI/local documented
- Smoke test checklist on clean Windows machine
- Version 0.1.0 tag ready
- CI/CD aligned with [CI_CD.md](./CI_CD.md): `ci.yml` on push/PR, `release.yml` on `v*.*.*` tags attaching exe to GitHub Release

**Exit criteria:** Installable or portable exe runs without dev tooling; DB and settings persist in userData. Pushing tag `v0.1.0` triggers release workflow and publishes the exe artifact.

**Completed 2026-06-14:** NSIS installer via `pnpm build:exe`, output `release/Focus OS Setup 0.1.0.exe`, `asarUnpack` for better-sqlite3, release.yml artifact glob aligned, local smoke test passed (packaged exe launches).

**Released 2026-06-16:** v0.1.0 tagged and shipped. Installer rebuilt with Phases 13–18 (chat-first shell, AI fallback, Eisenhower Task Matrix, capacity-aware buffer, notification system, scroll fixes). CHANGELOG and PROMPTS_LOG updated; 249 tests passing at release.

## Phase 13: Chat-First Shell and Intent Router

**Status:** Complete

**Goal:** Replace sidebar-first navigation with a chat thread as the primary interface; route user messages to existing IPC via deterministic pattern matching.

**Deliverables**

- Chat shell at `/`: scrollable message history, input bar with placeholder mic icon
- Collapsible icon rail for legacy screens; `/menu` chat command lists screens
- Top status bar retained above chat
- Proactive wake-time prompt in chat (replaces wake modal); full generate + commit flow
- Shared intent router (`src/shared/chat/`) with template-based responses
- Message type with attachment union stub for Phase 15
- sessionStorage chat history (last 80 messages)
- Unit tests for all intent categories and unrecognized-no-IPC guarantee

**Exit criteria:** User can manage wake time, tasks, blocks, breaks, faith log, and schedule queries via chat; legacy screens accessible via rail; 99 tests pass.

**Completed 2026-06-15:** ChatShell, ScreenIconRail, ChatContext, useChatOrchestrator, classifyIntent with 10 intent categories, responseTemplates module, extended quickAddTask client matching (initialism), Dashboard moved to `/dashboard`. Gap-fill (same date): time-aware proactive greeting, typing indicator, Framer Motion message animations, contextual suggestion chips, optional `user_display_name` in app_settings. Fix/addition pass (same date): Edit Client form UX, per-client recurring reminders, persisted sidebar, tray background mode, Windows auto-launch toggle. Check-in countdown refinement (same date): self-resetting due-state system tied to fixed-block windows supersedes block-tied `clientReminderService`. **UX/behavior overhaul (2026-06-15):** Chat merged into Dashboard at `/` as `HomeDashboardScreen`; auto block progression (pre-completion warnings, auto-complete + advance, extend +5, skip); contextual inline chips on assistant messages; 168 tests.

## Phase 14: AI Fallback for Chat

**Status:** Complete

**Goal:** When deterministic intent matching fails, route ambiguous input through the existing AI provider chain (OpenRouter free models, Ollama fallback) to classify intent or generate a helpful reply.

**Completed 2026-06-15:** `chatAiService` with config-driven free-model chain (0.70 confidence threshold), `chat:ai-fallback` IPC, `chat_ai_log` audit table, classify-and-execute plus conversational modes, `AiThinkingIndicator`, 25 new tests (220 total).

## Phase 15: Inline Rich Components

**Status:** Complete

**Goal:** Render schedule cards, task summaries, and other structured data as inline message attachments instead of plain text only.

**Completed 2026-06-15:** Five attachment types (`schedule_card`, `task_summary_card`, `faith_streak_card`, `focus_score_card`, `planned_vs_actual_card`), shared shapers, inline React renderers in message bubbles, sessionStorage serialization tests.

## Phase 16: Voice Input

**Status:** Complete

**Goal:** Wire the chat input bar mic button to speech-to-text for hands-free commands.

**Completed 2026-06-15:** Web Speech API mic in `ChatInputBar`, interim/final transcript population (no auto-send), 3s silence auto-stop, permission/unsupported graceful disable, `voice_input_enabled` / `voice_output_enabled` settings toggles, optional SpeechSynthesis for assistant messages.

## Phase 17: Motion and Transitions

**Status:** Complete

**Goal:** Polish chat and shell animations for a more responsive, automatic feel.

**Completed 2026-06-15:** Framer Motion on attachment cards, legacy screen route transitions (`AnimatePresence`), persistent banner enter/exit, distinct AI thinking state vs typing indicator (200ms transitions).

## Phase 18: Remaining Screen Migration

**Status:** Complete

**Goal:** Move remaining Daily Workspace, Settings, and other screen workflows into chat-first flows where appropriate.

**Completed 2026-06-15:** New intents `query_status`, `query_tasks`, `complete_task`, `replan_day`; Daily Workspace and Schedule removed from icon rail (routes remain for deep links); Settings/Review/Journal history stay as dedicated screens; `executeIntent` extraction for shared IPC path.

## Follow-up Work (not yet scheduled as phases)

## Phase Dependency Graph

```
1 Scaffold → 2 SQLite → 3 Settings
                ↓
         4 Allocation Engine
                ↓
    5 Wake/Workspace → 6 Schedule/Dashboard → 7 Tasks
                ↓
         8 Breaks → 9 Journal → 10 Review → 11 Insight → 12 Package
                ↓
    13 Chat Shell → 14 AI Fallback → 15 Rich Components → 16 Voice → 17 Motion → 18 Migration
```

**Implementation note (2026-06-14):** Phases 5 through 8 were built in dependency order **7 → 5 → 6 → 8** (tasks before schedule generation). Roadmap phase numbers are unchanged.

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
- [CI_CD.md](./CI_CD.md)
