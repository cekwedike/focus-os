# Prompts Log

This file tracks prompts given to Cursor (and other AI assistants) while building Focus OS. The purpose is to trace what was requested, decided, and built across sessions so work stays coherent when development spans days or weeks.

## How to Use

After each significant AI session:

1. Add a new entry at the **top** of the log (below this section), newest first.
2. Include date, rough goal, outcome, and files or phases touched.
3. Note any spec changes (e.g. "updated ALLOCATION_ENGINE.md with MVB rule").
4. Link blockers or follow-ups for the next session.

Keep entries concise but specific enough that a future you (or Cursor) can resume without re-reading entire chat threads.

## Entry Template

```markdown
### YYYY-MM-DD: Short title

**Prompt summary:** What was asked.

**Outcome:** What was delivered or decided.

**Files / phases:** List of docs, code paths, or roadmap phases.

**Follow-ups:** Optional next steps.
```

## Entries

### 2026-06-15: Client Form, Reminders, Sidebar, Tray (Fix/Addition Pass)

**Prompt summary:** Edit Client form fixes (weight label, hours/minutes duration, empty placeholders), per-client recurring reminders while block is active, persisted sidebar state, Windows auto-launch, system tray with hide-on-close background operation.

**Outcome:** Fix/addition pass (not a new roadmap phase). Migration 007: `reminder_*` columns on `clients_projects`, `sidebar_expanded`, `launch_at_login`, `tray_close_tip_shown` in app_settings. `clientReminderService`, `notificationService`, `trayService`, `loginItemService`, `work:set-paused` IPC. `chat:assistant-message` for main-to-chat delivery. `DurationInput` component. Allocation excludes fixed-block clients from weighted distribution.

**Files / phases:** ClientProjectForm, ScreenIconRail, index.ts, src/shared/reminders/, StartupBackgroundSection, SCHEMA.md, ARCHITECTURE.md.

**Follow-ups:** None required for this pass.

### 2026-06-15: Phase 13 Gap-Fill (Proactive Greeting, Typing, Chips)

**Prompt summary:** Complete missed Phase 13 requirement 1: proactive time-aware greeting on chat load, typing indicator before all assistant messages, Framer Motion message entrance animations, contextual quick-action chips. Optional user display name in Settings.

**Outcome:** Gap-fill complete (not a new roadmap phase). `user_display_name` in app_settings (migration 006). Shared modules: `greeting.ts`, `typingDelay.ts` (650-1100ms delay), `suggestionChips.ts`, `proactiveGreetingSession.ts`. Renderer: `TypingIndicator`, `AnimatedChatMessageBubble`, `SuggestionChips`, `useAssistantDelivery`, `useProactiveGreeting`. Session-once greeting via `focus-os-greeting-sent-v1`. framer-motion added. New unit tests for greeting boundaries, chips, typing delay, session flag.

**Files / phases:** src/shared/chat/greeting.ts, src/renderer/chat/, migration 006, DisplayPreferencesSection, ARCHITECTURE.md, ROADMAP Phase 13 note. Phase 13 gap-fill only.

**Follow-ups:** Phase 14 AI fallback for unrecognized chat input.

### 2026-06-15: Phase 13 Chat-First Shell and Intent Router

**Prompt summary:** Extended roadmap Phase 13: chat-first primary interface, deterministic intent router routing to existing IPC, template responses, icon rail for legacy screens, proactive wake-time in chat, sessionStorage history, unit tests.

**Outcome:** Phase 13 complete. Chat at `/`, Dashboard at `/dashboard`, ScreenIconRail replaces sidebar, WakeTimeModal removed from shell flow. Shared modules in `src/shared/chat/` (intentRouter, responseTemplates, parsers, intents). 34 new chat/parsing tests; 99 total pass. Phases 14-18 added to ROADMAP as Not Started.

**Files / phases:** src/shared/chat/, src/shared/types/chat.ts, src/renderer/chat/, ChatContext, AppShell refactor, quickAddTask client initialism, ARCHITECTURE.md chat section, ROADMAP Phases 13-18. Phase 13 Complete.

**Follow-ups:** Phase 14 AI fallback for unrecognized chat input.

### 2026-06-14: Phases 11 and 12 Daily Insight + Windows Packaging (Roadmap Complete)

**Prompt summary:** Final roadmap phases: Daily Insight AI (OpenRouter primary, Ollama fallback, graceful degradation, insights_log persistence) and Windows NSIS packaging via electron-builder with CI release workflow.

**Outcome:** All 12 roadmap phases complete. Daily Insight auto-generates on first open, degrades to raw local summary when AI unavailable, Settings includes Test Connection. NSIS installer builds to `release/Focus OS Setup 0.1.0.exe`. 65 tests pass. Packaged exe smoke test: app launches successfully.

**Files / phases:** src/main/insights/, src/main/ai/, src/main/services/aiService.ts, insightService.ts, insightsLogRepository.ts, insightHandlers.ts, DailyInsight screen, settings:test-ai-providers, package.json build config, release.yml. Phases 11 and 12 Complete. Initial 12-phase roadmap finished.

**Follow-ups:** Optional code signing, custom icon polish, Phase 13+ enhancements as needed.

### 2026-06-14: Phases 9 and 10 Journal + Review

**Prompt summary:** Implement Phase 9 Journal (faith_log CRUD, streak calculation, faith-block entry flow, full Journal UI, live streak badges) and Phase 10 Review (planned vs actual aggregation, break analysis, CSS bar charts, date-range UI) per approved plan.

**Outcome:** Both phases complete. Journal IPC (`journal:get-entry`, `journal:upsert`, `journal:list`, `journal:list-range`, `journal:stats`, `journal:complete-faith-block`) and Review IPC (`review:get-summary`). Faith streak pure function with unit tests. Review aggregators tested. 55 tests pass.

**Files / phases:** src/shared/utils/faithStreak.ts, wordCount.ts, src/shared/review/, src/main/db/repositories/faithLogRepository.ts, reviewRepository.ts, src/main/services/journalService.ts, reviewService.ts, src/main/ipc/journalHandlers.ts, reviewHandlers.ts, src/renderer/screens/Journal/, Review/, FaithEntryModal, useFaithStreak, FaithEntryContext. Phases 9 and 10 Complete.

**Follow-ups:** Phase 11 Daily Insight AI, optional Review CSV export.

### 2026-06-14: Phases 5, 6, 7, and 8 Combined (Tasks, Workspace, Schedule, Breaks)

**Prompt summary:** Combined implementation of Task Matrix (7), Daily Workspace (5), Schedule + Dashboard (6), and Breaks System (8) in build order 7 → 5 → 6 → 8. Full IPC CRUD for tasks, daily_settings, daily_schedule, breaks_log; scheduleService centralizes preview/commit/reallocate; natural language quick-add; wake-time modal; micro-break and long-break flows.

**Outcome:** All four phases complete. 34+ tests pass. Migration 005 seeds `__unassigned__` system client. Focus score = completed work blocks / total work blocks. Micro-break timer uses accumulated active-block time. Schedule time edits via control (drag-and-drop deferred).

**Files / phases:** src/main/db/repositories/tasksRepository.ts, dailySettingsRepository.ts, dailyScheduleRepository.ts, breaksLogRepository.ts, src/main/services/scheduleService.ts, timerService.ts, stalenessService.ts, src/main/ipc/taskHandlers.ts, scheduleHandlers.ts, dailyHandlers.ts, breakHandlers.ts, src/shared/parsing/quickAddTask.ts, src/renderer/screens/TaskMatrix/, DailyWorkspace/, Schedule/, Dashboard/, context/ScheduleContext.tsx, BreakContext.tsx. Phases 5, 6, 7, 8 Complete.

**Follow-ups:** Phase 9 Journal (Faith Streak live), Phase 10 Review charts.

### 2026-06-14: Phases 3 and 4 Settings + Allocation Engine

**Prompt summary:** Combined Phase 3 (Settings screen with clients/projects CRUD, protected blocks config, app_settings IPC, OpenRouter key via secrets file) and Phase 4 (standalone allocation engine per ALLOCATION_ENGINE.md with Vitest coverage and main-process mapper).

**Outcome:** Settings screen replaces placeholder with four sections wired to IPC. OpenRouter API key stored in `{userData}/secrets.json` (main process only; renderer sees configured boolean). Migration 002 seeds `default_buffer_percent` and `doomscroll_allowance_minutes`. Allocation engine in `src/shared/allocation/` implements full day generation and long-break re-allocation with replan summary. 22 tests pass (4 migration + 17 allocation + 1 placeholder).

**Files / phases:** src/renderer/screens/Settings/, src/renderer/components/ui/, src/main/ipc/settingsHandlers.ts, src/main/services/secretsService.ts, src/main/db/repositories/appSettingsRepository.ts, src/shared/allocation/, src/main/allocation/runAllocation.ts, tests/allocation/, SECURITY.md, ROADMAP.md. Phases 3 and 4 Complete.

**Follow-ups:** Phase 5 Daily Workspace wake-time flow and schedule persistence.

### 2026-06-14: pnpm switch and Phase 2 SQLite

**Prompt summary:** Part A: migrate from npm to pnpm (lockfile, docs, CI workflows, .npmrc hoisted linker). Part B: Phase 2 SQLite per SCHEMA.md with better-sqlite3, migration runner, 9 tables, seed protected_blocks and app_settings, IPC CRUD for clients_projects and protected_blocks, Vitest migration tests.

**Outcome:** pnpm is the package manager (`pnpm-lock.yaml`, `packageManager` field, CI uses `pnpm install --frozen-lockfile`). Database initializes in Electron userData, migrations are idempotent, 5 protected block types seeded. IPC exposes `db:health` and full clients/protected-blocks CRUD via `window.focusOS`. All checks pass with pnpm.

**Files / phases:** package.json, .npmrc, .gitignore, CI/CD docs and workflows, src/main/db/, src/main/ipc/clientHandlers.ts, shared types, tests/db/migrations.test.ts. Phase 2 Complete.

**Follow-ups:** Phase 3 Settings screen UI wired to clients and protected blocks IPC.

### 2026-06-14: Phase 1 Electron scaffold

**Prompt summary:** Scaffold Phase 1 per ROADMAP: Electron + Vite + React + TypeScript + Tailwind, dark/mint design tokens, sidebar and top status bar shell, routing to 8 placeholder screens, preload IPC bridge, ESLint/Prettier/Vitest, npm scripts for dev/build/build:exe/typecheck/lint/test.

**Outcome:** Application shell complete. electron-vite project with main/preload/renderer/shared structure per ARCHITECTURE.md. Live clock in top bar, sidebar navigation with active state, HashRouter defaulting to Dashboard. `app:ping` IPC stub via contextBridge. CI checks pass: typecheck, lint, test, build.

**Files / phases:** package.json, electron.vite.config.ts, tsconfig.*, tailwind/postcss, eslint/prettier/vitest configs, src/main, src/preload, src/renderer (8 screens), src/shared/types, tests/placeholder.test.ts, resources/.gitkeep. Phase 1 Complete.

**Follow-ups:** Phase 2 SQLite schema setup (better-sqlite3, 9 tables, migrations).

### 2026-06-14: CI/CD documentation and workflows

**Prompt summary:** Add CI/CD documentation and starter GitHub Actions workflows before Phase 1 scaffold. Document CI (typecheck, lint, test on push/PR), CD (Windows exe build on version tags), branching, semver tie to CHANGELOG, local pre-push checklist, and future signing/auto-update notes. Create `ci.yml` and `release.yml`. Update ROADMAP Phase 12 and PROMPTS_LOG.

**Outcome:** [CI_CD.md](./CI_CD.md) written with minimal solo-project CI/CD approach (checks on every push, exe only on tags). `.github/workflows/ci.yml` runs on push/PR to `main` (Node 20, npm ci, typecheck, lint, test). `.github/workflows/release.yml` runs on `v*.*.*` tags on windows-latest with safety gate then `npm run build:exe` and GitHub Release artifact upload. ROADMAP Phase 12 references CI_CD.md. No application code or `src/` scaffold.

**Files / phases:** CI_CD.md, .github/workflows/ci.yml, .github/workflows/release.yml, ROADMAP.md, PROMPTS_LOG.md. Pre-Phase 1.

**Follow-ups:** Phase 1 Electron + React + TypeScript + Tailwind scaffold; define `package.json` scripts (`typecheck`, `lint`, `test`, `build:exe`) so workflows pass.

### 2026-06-14: Foundational documentation

**Prompt summary:** Create all foundational markdown and config files for Focus OS before any application code: README, CHANGELOG, DEVELOPMENT, CONTRIBUTING, rules, ARCHITECTURE, SCHEMA, ALLOCATION_ENGINE, ROADMAP, PROMPTS_LOG, SECURITY, `.env.example`, and `.gitignore`. Full content based on project overview (Electron + React + TS desktop executive assistant for freelancers).

**Outcome:** Complete documentation suite written and aligned to project standards (1000-line file limit, no horizontal rules or em dashes in generated content). No application code scaffolded. Roadmap phases 1-12 marked Not Started. Schema defined for 9 SQLite tables. Hybrid allocation engine specified step-by-step including day re-planned summary. AI standards and security practices documented.

**Files / phases:** README.md, CHANGELOG.md, DEVELOPMENT.md, CONTRIBUTING.md, rules.md, ARCHITECTURE.md, SCHEMA.md, ALLOCATION_ENGINE.md, ROADMAP.md, PROMPTS_LOG.md, SECURITY.md, .env.example, .gitignore. Pre-Phase 1.

**Follow-ups:** Begin Phase 1 (Electron + React + TS + Tailwind scaffold with sidebar and top bar shell).
