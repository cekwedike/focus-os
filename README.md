# Focus OS

A desktop executive assistant for freelancers who juggle multiple clients and projects. Focus OS helps you structure your day around wake time, protected personal routines, client commitments, and priority tasks, so you spend less time deciding what to work on and more time doing it.

## Description

Focus OS is an Electron + React + TypeScript desktop application packaged as a Windows executable. It runs locally on your machine, stores all data in SQLite, and uses a deterministic allocation engine to build and adjust your daily schedule. AI-powered Daily Insights are advisory only; the schedule engine remains the source of truth.

Built for freelancers who manage dynamic, user-created clients and projects (never hardcoded), Focus OS balances faith and personal routines, fixed client blocks, weighted time distribution, task priorities, and break management in a single dark-themed workspace.

## Features

### Daily Scheduling

- **Wake-time based scheduling**: Log your wake time each morning; the app calculates remaining hours and auto-generates the rest of your day.
- **Hybrid allocation engine**: Protected blocks (morning routine, faith/Bible reading and prayer, meals, micro-breaks, wind-down) are placed first. Fixed client blocks with variable daily windows come next. Remaining time is distributed across active clients by weight percentage and filled with highest-priority tasks.
- **Long break handling**: Indicate reason and expected duration when stepping away. On return, the engine re-allocates the remaining day while keeping protected blocks intact, compressing client blocks proportionally, and bumping low-priority tasks to the next day when blocks would fall below minimum viable size. You see a day re-planned summary of what changed.

### Breaks and Focus

- **Micro-break popups**: Prompts every ~90 minutes with activity choices (read, walk, call someone, check messages, short doomscroll allowance).
- **Staleness tracking**: Alerts when a client or project has not been touched within a configurable threshold. Staleness alerts never override the schedule; they surface as notifications only.

### Faith and Journal

- **Daily faith log**: Bible reading reference and prayer notes entry.
- **Streak tracking**: Consecutive-day streak counter with full searchable history.
- **Stats**: Entries this month, longest streak, word count, and more.

### Tasks and Review

- **Task Matrix**: Central task list across all clients, filterable, with natural language quick-add.
- **Review screen**: Weekly and historical planned vs actual hours per client, plus break log analysis.

### Daily Insight

- **AI daily briefing**: Synthesizes today's schedule, staleness alerts, faith streak, yesterday's planned vs actual, and suggestions.
- **Provider routing**: OpenRouter as primary AI provider, Ollama as offline fallback. If neither is available, the screen degrades gracefully to raw data without AI synthesis. AI never auto-modifies the schedule.

### Settings

- Client/project CRUD (name, color, weight percent, active status, fixed block defaults).
- Protected block preferences and buffer percentage.
- OpenRouter API key and model selection, Ollama endpoint configuration.
- Notification preferences.

### UI

- Dark theme with mint green accent (`#2DD4A0`).
- Card-based layout with sidebar navigation: Dashboard, Daily Workspace, Task Matrix, Schedule, Daily Insight, Journal, Review, Settings.
- Persistent top status bar: current time/block, faith streak badge, focus score, long-break button, notifications.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron |
| UI | React + TypeScript |
| Styling | Tailwind CSS |
| Local database | better-sqlite3 |
| Packaging | electron-builder (Windows `.exe`) |
| AI (online) | OpenRouter |
| AI (offline) | Ollama |

## Prerequisites

- **Node.js**: v20 LTS or later (see `DEVELOPMENT.md`)
- **npm** (default; pnpm acceptable alternative, pick one at Phase 1 scaffold)
- **Windows** for native `.exe` builds (development may run cross-platform)
- **Ollama** (optional): for offline Daily Insight fallback

## Installation

> Application code is not yet scaffolded. These steps will be updated once Phase 1 of the roadmap is complete.

```bash
# Clone the repository
git clone <repository-url>
cd focus-os

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your OpenRouter API key and model preferences (optional)
```

## Development

```bash
# Start Electron in development mode (main + renderer with hot reload)
npm run dev
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for environment setup, process architecture, and Cursor workflow notes.

## Building the Executable

```bash
# Production build and Windows packaging via electron-builder
npm run build
npm run package:win
```

Output will be written to the `dist/` or `release/` directory (exact path defined at scaffold time). The packaged artifact is a standalone Windows `.exe` installer or portable build depending on electron-builder configuration.

## Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, IPC, module breakdown |
| [SCHEMA.md](./SCHEMA.md) | SQLite table definitions |
| [ALLOCATION_ENGINE.md](./ALLOCATION_ENGINE.md) | Schedule allocation algorithm spec |
| [ROADMAP.md](./ROADMAP.md) | 12-phase build order |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Local dev setup and workflow |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Solo project working guidelines |
| [rules.md](./rules.md) | AI coding standards for Cursor |
| [SECURITY.md](./SECURITY.md) | Data handling and API key practices |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [PROMPTS_LOG.md](./PROMPTS_LOG.md) | Cross-session prompt trace |

## License

TBD (solo project; license to be decided before public release).

## Status

**Pre-development.** Foundational documentation only. See [ROADMAP.md](./ROADMAP.md) for the planned build phases.
