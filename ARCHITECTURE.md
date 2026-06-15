# Architecture

Focus OS is a local-first Electron desktop application with a clear split between privileged backend work (main process) and the React UI (renderer). Scheduling logic lives in a standalone, testable module; AI is an optional advisory layer.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Renderer (React + TS)                       │
│  Home Dashboard │ Icon Rail │ Legacy Screens │ Context │ Components │
└────────────────────────────┬────────────────────────────────────┘
                             │ contextBridge (preload)
                             │ invoke / on events
┌────────────────────────────▼────────────────────────────────────┐
│                     Main Process (Node + Electron)                │
│  IPC Handlers │ SQLite │ Timers │ Notifications │ AI Router     │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   better-sqlite3      OS Notifications      OpenRouter / Ollama
   (focus-os.db)       (micro-breaks)        (Daily Insight only)
```

```mermaid
flowchart TB
  subgraph renderer [RendererProcess]
    UI[ScreensAndComponents]
    Ctx[ReactContext]
  end
  subgraph preload [PreloadBridge]
    API[window.focusOS]
  end
  subgraph main [MainProcess]
    IPC[IPCHandlers]
    DB[(SQLite)]
    Engine[AllocationEngine]
    Timers[TimerService]
    Notify[NotificationService]
    AI[AIService]
  end
  UI --> API
  API --> IPC
  IPC --> DB
  IPC --> Engine
  Engine --> DB
  Timers --> Notify
  IPC --> AI
  AI --> OpenRouter[OpenRouterOptional]
  AI --> Ollama[OllamaLocal]
```

## Design Principles

1. **Local-first**: All user data stored in SQLite on disk; app functions fully offline except optional OpenRouter calls.
2. **Deterministic scheduling**: Allocation engine produces schedules from explicit inputs; same inputs yield same output.
3. **AI advisory boundary**: AI reads snapshots and returns text insights; it never writes schedule or task rows directly.
4. **Thin IPC, fat shared types**: Payload shapes defined in `src/shared/types/` and reused everywhere.
5. **Testability**: Pure allocation module tested without Electron; DB layer tested with temp databases.
6. **File size discipline**: No source file exceeds 1000 lines; split modules early per [rules.md](./rules.md).

## Main Process Responsibilities

| Area | Responsibility |
|------|----------------|
| Application lifecycle | Create window, handle quit, single-instance lock (optional) |
| SQLite | Open DB, migrations, CRUD for all 9 tables, transactions |
| Allocation persistence | Invoke allocation engine, write `daily_schedule` and related rows atomically |
| Timers | Micro-break interval (~90 min), staleness check interval, block pre-completion warnings (15/10/5 min), auto-complete + advance at `planned_end` |
| Notifications | Desktop notifications for breaks, staleness, optional insight ready |
| AI routing | OpenRouter HTTP (primary), Ollama HTTP (fallback), timeout and error handling |
| Chat AI fallback | Free-model chain for unrecognized chat input; classify-and-execute or conversational reply |
| Config | Load `.env`, merge with `app_settings`, secure API key access |
| File paths | Resolve userData DB path, optional dev overrides |

### Main Module Layout

```
src/main/
├── index.ts                 # App bootstrap, BrowserWindow
├── ipc/
│   ├── index.ts             # Register all handlers
│   ├── scheduleHandlers.ts
│   ├── taskHandlers.ts
│   ├── clientHandlers.ts
│   ├── journalHandlers.ts
│   ├── insightHandlers.ts
│   └── settingsHandlers.ts
├── db/
│   ├── connection.ts
│   ├── migrations/
│   └── repositories/        # One module per aggregate (tasks, schedule, etc.)
├── services/
│   ├── timerService.ts      # Micro-break accumulator + progression tick
│   ├── blockProgressionService.ts  # complete/advance, extend, skip
│   ├── blockNotificationService.ts # Pre-completion warnings + chat posts
│   ├── chatAssistantBridge.ts      # Main → renderer assistant messages
│   ├── stalenessService.ts  # Client staleness alerts
│   ├── checkInService.ts           # Self-resetting check-in countdown
│   ├── workPauseService.ts  # Pause state from Schedule/Dashboard
│   ├── notificationService.ts    # Desktop notifications
│   ├── trayService.ts            # System tray
│   ├── loginItemService.ts       # Windows auto-launch
│   ├── journalService.ts    # Faith log upsert, stats, complete-faith-block transaction
│   ├── reviewService.ts     # Compose reviewRepository + shared/review aggregators
│   ├── insightService.ts    # Daily snapshot + AI generation + insights_log persistence
│   └── aiService.ts         # OpenRouter/Ollama routing with graceful fallback
│   └── chatAiService.ts     # Chat fallback: free-model chain, structured JSON response
└── allocation/
    └── runAllocation.ts     # Load DB state → engine → persist (orchestration)
```

## Renderer Process Responsibilities

| Area | Responsibility |
|------|----------------|
| UI shell | Merged home dashboard (chat + day panel), collapsible icon rail, top status bar, routing |
| Chat orchestrator | Intent router (shared), template responses, sessionStorage history, inline contextual chips |
| Legacy screens | Daily Workspace, Task Matrix, Schedule, Daily Insight, Journal, Review, Settings (secondary access via icon rail or `/menu`) |
| Forms & modals | Long break (top bar shortcut), micro-break activity picker |
| Local UI state | Selected filters, modal open state, draft form fields |
| Display | Timelines, CSS flex bar charts on Review (no chart library), streak badges, focus score visualization |
| IPC client | Call preload API; subscribe to push events |

### Renderer Module Layout

```
src/renderer/
├── main.tsx
├── App.tsx                  # Router + layout shell
├── routes.tsx
├── chat/                    # Primary UI (Phase 13+)
│   ├── ChatShell.tsx
│   ├── ChatThread.tsx
│   ├── ChatInputBar.tsx
│   ├── TypingIndicator.tsx
│   ├── AnimatedChatMessageBubble.tsx
│   ├── SuggestionChips.tsx
│   ├── ScreenIconRail.tsx
│   └── hooks/
│       ├── useChatSession.ts
│       ├── useChatOrchestrator.ts
│       ├── useAssistantDelivery.ts
│       └── useProactiveGreeting.ts
├── context/
│   ├── ChatContext.tsx
│   ├── ScheduleContext.tsx
│   ├── SettingsContext.tsx
│   └── NotificationContext.tsx   # Persistent banner + notification IPC
├── screens/
│   ├── Home/                # Merged Dashboard + Chat at /
│   ├── Dashboard/           # Shared day-panel card components
│   ├── DailyWorkspace/
│   ├── TaskMatrix/
│   ├── Schedule/
│   ├── DailyInsight/
│   ├── Journal/
│   ├── Review/
│   └── Settings/
├── components/
│   ├── layout/              # TopBar, icon rail helpers
│   ├── schedule/            # Timeline, BlockCard
│   └── shared/              # Button, Input, Badge
└── hooks/
    ├── useIpc.ts
    └── useCurrentBlock.ts

src/shared/chat/             # Testable intent router (no Electron)
├── intentRouter.ts          # classifyIntent()
├── greeting.ts              # Time-aware greeting and welcome-back copy
├── typingDelay.ts           # Assistant typing delay helpers
├── suggestionChips.ts       # Contextual quick-action chips
├── proactiveGreetingSession.ts
├── responseTemplates.ts     # Template-based assistant text
├── routerContext.ts
├── parsers/                 # Wake time, duration, client, block title
└── intents/                 # One module per intent category
```

## Home Dashboard (Merged Chat + Day Panel)

Route `/` renders `HomeDashboardScreen`: chat is the dominant center column; a **Day Panel** sidebar (desktop) shows Live Execution, Up Next, Focus Score, Faith Streak, Next Break, and Staleness Radar. On mobile, a **Day** toggle opens the same panel as a slide-over drawer.

Chat is no longer a separate route or icon-rail item. `/dashboard` redirects to `/`.

### Layout (desktop)

```
Chat panel (~65%)  |  Day panel (w-80)
ChatThread         |  RightNowCard (Pause, Extend +5, Skip, Complete)
ChatInputBar       |  UpNext, widgets...
```

Dual control paths: Live Execution card buttons and chat commands (`extend by 5`, `skip this`, `I'm done`) both invoke the same IPC handlers.

## Chat Shell and Intent Router (Phase 13+)

Focus OS uses a **conversational home interface** at route `/`. Legacy screens remain available via the icon rail and `/menu`.

### Message Flow

```
User types in ChatInputBar
  → useChatOrchestrator.processMessage()
  → classifyIntent() in src/shared/chat/intentRouter.ts (pure, deterministic)
  → if ambiguousMessage: clarification template (no IPC, no AI)
  → else if definite intent: executeIntent() → existing IPC handlers
  → else if unrecognized: chat:ai-fallback (chatAiService)
       → execute mode: same executeIntent() path (never bypasses IPC)
       → conversational mode: snapshot-based reply + optional attachment
       → unavailable: honest unrecognized() template
  → useAssistantDelivery shows typing or AiThinkingIndicator, then appends message
  → ChatMessage (content + attachments[]) persisted in sessionStorage (last 80 messages)
```

### Rich attachments (Phase 15)

`ChatMessage.attachments` supports: `schedule_card`, `task_summary_card`, `faith_streak_card`, `focus_score_card`, `planned_vs_actual_card`. Pure shapers live in `src/shared/chat/attachments/`; React renderers in `src/renderer/chat/attachments/`. Query intents and AI conversational replies attach cards when data adds clarity.

### AI chat fallback (Phase 14)

Trigger: `intent === 'unrecognized'` (confidence threshold 0.70 documented for future weak matches). Main process `chatAiService` tries `openrouter_free_models` from app_settings (default four free-tier ids), then Ollama, max 5 attempts / 45s chain timeout. Every attempt logged to `chat_ai_log` with source, model, and action taken.

### Voice input (Phase 16)

`ChatInputBar` mic uses Web Speech API when `voice_input_enabled` is true. Transcribed text populates the input field; user must press Send (no auto-send). Optional `voice_output_enabled` reads new assistant messages via SpeechSynthesis (new message cancels in-progress speech).

### Future Hook Points

| Phase | Hook location | Purpose |
|-------|---------------|---------|
| 14 | `intentRouter.ts` after deterministic pass | AI fallback for ambiguous input |
| 15 | `ChatMessage.attachments` + `ChatMessageBubble` | Inline rich components (schedule cards, etc.) |
| 16 | `ChatInputBar` mic button | Voice input |
| 17 | Chat UI components | Motion and transitions |
| 18 | Orchestrator + router | Migrate remaining screen workflows into chat |

(Phases 14-18 complete as of 2026-06-15.)

### Persistence

Chat history uses **sessionStorage** (`focus-os-chat-v1`), capped at 80 messages. Proactive greeting uses **sessionStorage** (`focus-os-greeting-sent-v1`) so it fires once per app session. Optional display name for greetings: `app_settings.user_display_name` (Settings → Time And Calendar → Your Name).

### Proactive greeting and typing delivery

On Chat mount, `useProactiveGreeting` checks wake time and schedule state, then delivers one or two assistant messages via `useAssistantDelivery`:

1. Time-aware greeting (`Good morning.` or `Good morning, Name.`)
2. Wake-time follow-up if wake time not logged (`What time did you wake up?`)

If wake time is already logged, a welcome-back message references the active block, next block, or missing schedule.

Before each assistant message, a **typing indicator** shows for 650-1100ms (random), with a 350ms gap between sequential greeting messages. All intent-router responses use the same delivery pipeline.

**Framer Motion:** `TypingIndicator`, `AnimatedChatMessageBubble`, attachment card entrance, legacy screen route transitions, persistent banner enter/exit (200ms). AI fallback uses `AiThinkingIndicator` instead of fake typing delay.

**Suggestion chips** are **inline** on assistant messages (contextual quick replies), not a persistent row below the thread. Contexts include welcome-back, pre-completion warnings, auto-progression, extend/skip confirmations, and wake-time prompts.

### Main-process assistant messages

The main process pushes text into the chat thread via IPC event `chat:assistant-message` with optional `quickReplies`. Used for check-in reminders, pre-completion warnings (15/10/5 min), auto-complete/advance, extend confirmations, and skip confirmations.

Reopening the app from the system tray does **not** re-trigger the proactive greeting; `focus-os-greeting-sent-v1` persists for the app session until restart.

### Conversation State

The orchestrator tracks `pendingPrompt` (wake time), `longBreakActive`, and faith block context. On first open each day without `wake_time`, the assistant proactively asks for wake time and replaces the Phase 5 wake modal.

## Preload and IPC Pattern

The preload script exposes a minimal typed API on `window.focusOS` via `contextBridge.exposeInMainWorld`.

### Security

- `nodeIntegration: false`, `contextIsolation: true`.
- Only whitelisted channels exposed; no raw `ipcRenderer` in renderer.

### Communication Styles

**Request/response (renderer → main)**

```typescript
// Renderer
const schedule = await window.focusOS.schedule.generate({ wakeTime, date });

// Main handler
ipcMain.handle('schedule:generate', async (_event, payload) => {
  return runAllocation(payload);
});
```

**Push events (main → renderer)**

```typescript
// Main (timer fired)
mainWindow.webContents.send('break:micro-break-due', { suggestedActivities });

// Renderer subscribe
window.focusOS.onMicroBreakDue(callback);
```

### IPC Channel Map (Planned)

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `schedule:generate` | invoke | Full day generation from wake time |
| `schedule:reallocate` | invoke | Post-long-break re-allocation |
| `schedule:get-day` | invoke | Fetch blocks for date |
| `schedule:complete-and-advance` | invoke | Complete block early or on demand and start next block |
| `schedule:extend-block` | invoke | Extend active block +5 min, cascade later blocks |
| `schedule:skip-block` | invoke | Skip skippable block, reclaim time, advance |
| `work:get-paused` | invoke | Read main-process pause flag |
| `tasks:*` | invoke | CRUD + matrix queries |
| `clients:*` | invoke | CRUD clients/projects |
| `journal:*` | invoke | Faith log read/write, search, stats, complete-faith-block |
| `review:get-summary` | invoke | Planned vs actual, breaks, task completion for date range |
| `insights:generate` | invoke | Build snapshot, call AI, persist to insights_log |
| `chat:ai-fallback` | invoke | Classify or converse on unrecognized chat input; log to chat_ai_log |
| `insights:get-today` | invoke | Latest insight for a date |
| `insights:list` | invoke | Insight history |
| `settings:test-ai-providers` | invoke | Minimal OpenRouter/Ollama connectivity test |
| `settings:*` | invoke | App and daily settings |
| `breaks:log` | invoke | Record micro/long break |
| `break:micro-break-due` | event | Popup trigger |
| `staleness:alert` | event | Client untouched threshold |

Types for every payload live in `src/shared/types/ipc.ts`.

## Standalone Allocation Engine

Location: `src/shared/allocation/`

Pure TypeScript module with no Electron or React imports.

```
src/shared/allocation/
├── index.ts                 # Public API: allocateDay, reallocateAfterLongBreak
├── types.ts                 # Block, Task, ClientInput, AllocationResult
├── steps/
│   ├── placeProtectedBlocks.ts
│   ├── placeFixedClientBlocks.ts
│   ├── applyBuffer.ts
│   ├── distributeWeighted.ts
│   └── fillTasksByPriority.ts
├── reallocate.ts            # Long break compression + task bumping
└── constants.ts             # MIN_VIABLE_BLOCK_MINUTES, defaults
```

**Inputs**: wake time, date, clients (weights, fixed windows, active flag), tasks (priority, deadline, client), protected block config, daily settings (buffer %), existing break log for the day.

**Outputs**: ordered list of schedule blocks with assigned tasks, bumped task IDs, warnings (staleness passed through separately).

Main process `runAllocation.ts` loads rows from SQLite, maps to engine types, runs engine, persists results in a transaction.

**Schedule timestamps**: `planned_start` and `planned_end` on generated blocks use local wall-clock ISO strings (`YYYY-MM-DDTHH:mm:ss`, no `Z`) via `src/shared/utils/scheduleTimestamp.ts`. Extend, skip, and shift cascades must use the same helpers so UTC suffixes never mix into planned columns. See [SCHEMA.md](./SCHEMA.md) for the binding convention.

Unit tests import engine directly without starting Electron.

## AI Service Layer

Location: `src/main/services/aiService.ts`

### Provider Routing

```
1. If OpenRouter API key present → POST to OpenRouter with configured model
2. Else if Ollama endpoint reachable → POST to local Ollama
3. Else → return structured "unavailable" insight; log source `none`
```

### Prompt Construction

Builds a **snapshot** from:

- Today's schedule summary (block types, client names, durations)
- Task list highlights (overdue, high priority)
- Staleness alerts
- Faith Streak and yesterday journal presence
- Yesterday planned vs actual hours (aggregated)

Does **not** include: raw API keys, full historical journal text (summaries/excerpts only), or system file paths.

### Response Handling

- Store result in `insights_log` with `source`: `openrouter` | `ollama` | `none`.
- Return markdown or structured sections to renderer for Daily Insight screen.
- Timeout and retry once on transient failure; then fall back down the chain.

### Graceful Degradation

UI shows last cached insight, partial template, or friendly offline message. Schedule UI unaffected.

## Notification System

Central module: `src/main/services/notificationService.ts`. All alert producers call `notify(payload)` which:

1. Inserts a row into `notifications_log`
2. Optionally registers persistent unacknowledged state (keyed by `dedupeKey`)
3. Fires a desktop notification when the category is enabled in `app_settings.notifications`
4. Emits `notification:dispatched` to the renderer for chat and/or banner handling

Supporting modules: `desktopNotification.ts` (icon, click-to-focus), `notificationActionRouter.ts` (action handlers), `notificationHandlers.ts` (IPC).

### `notify()` payload

| Field | Purpose |
|-------|---------|
| `type` | `micro_break`, `check_in_due`, `block_warning`, `block_complete`, `block_skipped`, `faith_reminder`, `staleness_alert`, `generic` |
| `title`, `message` | User-facing copy |
| `urgency` | `normal` or `high` (stored in log) |
| `persistent` | When true, shows in `PersistentNotificationBanner` until acknowledged |
| `dedupeKey` | Prevents duplicate desktop/chat for the same logical event while unacknowledged |
| `actions` | Optional buttons routed through `notification:action` |
| `showInChat` | Default true; set false for tray-only tips |
| `metadata` | Domain context (e.g. `clientId`, `blockId`) for action routing |

### IPC channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `notification:dispatched` | event | Full payload + `id`, `createdAt`, `skippedDuplicate` |
| `notification:state-changed` | event | `{ active: ActiveNotificationSummary[] }` |
| `notification:acknowledged` | event | `{ notificationId }` clears chat chips |
| `notification:action` | invoke | Run action handler, set `acknowledged_at` |
| `notification:list-active` | invoke | Hydrate banner on mount |

### Renderer

`NotificationContext` subscribes to notification IPC, delivers chat messages via `useAssistantDelivery`, and drives `PersistentNotificationBanner` in `AppShell`. Chat messages link to notifications via `notificationId`; banner and chat action buttons share acknowledgment through the same `notifications_log` row.

### Producers

| Trigger | Source | `persistent` |
|---------|--------|----------------|
| Micro-break due | `timerService` | false |
| Client check-in due | `checkInService` | true |
| Block 15/10/5 min warning | `blockNotificationService` | false |
| Block auto-complete / skip / extend | `blockProgressionService` | false |
| Faith block without log | `faithReminderService` | true |
| Staleness threshold | `stalenessService` | false |
| Tray close tip | `index.ts` | false |

### Desktop vs in-app

Desktop notifications use `resources/icon.png`, respect per-category settings, and focus the main window on click. OS notifications cannot truly persist; the in-app banner is the persistent surface. If `Notification.isSupported()` is false or permissions are denied, in-app delivery still works.

When a persistent notification is already active for a `dedupeKey`, subsequent `notify()` calls skip desktop and chat dispatch and return the existing id.

## Timer System

`timerService.ts` runs in main process:

- **Micro-break scheduler**: Accumulates seconds only while a schedule block is `active` and work is not paused; fires `break:micro-break-due` at configured interval.
- **Pre-completion warnings**: `blockNotificationService` fires at 15, 10, and 5 minutes before active block `planned_end` (desktop notification + chat message). Timings recalculate after extend.
- **Auto-progression**: At `planned_end`, non-faith active blocks auto-complete and advance to the next `planned` block via `blockProgressionService`. Paused work blocks both warnings and auto-complete until resumed.
- **Staleness checker**: `stalenessService.ts` compares `last_touched_at` per active client; emits `staleness:alert`.

`workPauseService` tracks pause state in main process; `work:set-paused` and `work:get-paused` sync renderer Live Execution card with timers.

`checkInService.ts` polls every second for clients with `reminder_enabled` and a fixed-block window (including daily overrides from `daily_settings.notes`):

- Countdown anchor = max(window start, last acknowledgment today).
- When anchor + `reminder_interval_minutes` elapses, client enters **due** state (stays due until acknowledged).
- On due: one `chat:assistant-message`, one desktop notification, persistent banner via `check-in:state-changed`.
- Acknowledgment writes `check_ins_log` and restarts countdown from now.
- Outside the fixed-block window, due state and countdown pause until the next window.

All services keep running while the window is hidden to tray.

## Background and Tray

- Close (X) hides the main window; the process stays alive in the system tray.
- Tray menu: Open Focus OS, Quit. Quit sets `appQuitting` and stops all services.
- `launch_at_login` in app_settings (default false, opt-in) syncs via `app.setLoginItemSettings` on Windows.
- `sidebar_expanded` persists desktop nav rail width across app restarts (default expanded).

## Data Flow Examples

### Morning Wake-Time Flow

1. User opens app; chat assistant asks "What time did you wake up?" if no wake time logged today.
2. User replies (e.g. "9am"); intent router parses wake time.
3. Renderer calls `daily:upsert`, then `schedule:generate`, then `schedule:commit` (same IPC as Daily Workspace).
4. Assistant responds with a text summary of today's schedule; ScheduleContext refreshes.

### Long Break Return Flow

1. User clicks long break, enters reason/duration; `breaks:log` with type `long`.
2. Timers paused; UI shows break state.
3. On return, user confirms; `schedule:reallocate` with `returnTime`.
4. Engine preserves protected blocks, compresses client blocks, bumps tasks if needed.
5. Main replaces future blocks for the day in DB; renderer refreshes.

### Daily Insight Flow

1. User opens Daily Insight or auto-trigger on first open each day.
2. `insights:generate` builds snapshot, calls aiService.
3. Insight stored in `insights_log`; displayed read-only.
4. No schedule tables modified.

## Folder Structure Proposal

Full tree (target end state):

```
focus-os/
├── README.md
├── ARCHITECTURE.md
├── SCHEMA.md
├── ALLOCATION_ENGINE.md
├── src/
│   ├── main/                # See Main Module Layout above
│   ├── preload/
│   │   └── index.ts
│   ├── renderer/            # See Renderer Module Layout above
│   └── shared/
│       ├── types/
│       ├── allocation/      # Standalone engine
│       └── constants/
├── tests/
│   ├── allocation/
│   └── db/
├── resources/
│   ├── icon.ico
│   └── icon.png
├── electron-builder.yml
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts           # Or equivalent bundler config
```

## Technology Boundaries

| Concern | Allowed in renderer | Allowed in main |
|---------|---------------------|-----------------|
| better-sqlite3 | No | Yes |
| fs / path | No | Yes |
| fetch to OpenRouter | No (use main) | Yes |
| React | Yes | No |
| Allocation engine pure functions | Import for preview only (optional) | Yes (authoritative run) |

Optional: renderer may call a **read-only preview** of allocation for instant UI feedback before save; persisted schedule always from main.

## Error Handling

- IPC handlers return `{ ok: true, data }` or `{ ok: false, error: { code, message } }` for consistent renderer handling.
- DB writes use transactions; failed allocation rolls back.
- Log errors in main process file (rotating log in userData, not committed to repo).

## Future Considerations (Out of Scope for 0.1.0)

- Multi-window support
- Cloud sync
- macOS/Linux packaging
- Plugin system

## Related Documents

- [SCHEMA.md](./SCHEMA.md)
- [ALLOCATION_ENGINE.md](./ALLOCATION_ENGINE.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
- [SECURITY.md](./SECURITY.md)
