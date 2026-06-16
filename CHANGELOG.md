# Changelog

All notable changes to Focus OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Version numbering starts at **0.1.0** for the first functional release. Semantic versioning applies from 0.1.0 onward. During pre-1.0 development, minor versions may include breaking changes as the architecture stabilizes.

## [Unreleased]

## [0.1.0] - 2026-06-16

First functional release. Completes the initial 12-phase roadmap plus chat-first shell (Phases 13–18).

### Added

#### Core Platform

- Electron + React + TypeScript + Tailwind CSS application scaffold
- Windows NSIS installer via electron-builder (`pnpm build:exe`)
- better-sqlite3 local database with full schema (migrations through v17)
- Main/renderer IPC layer for database, timers, and notifications
- GitHub Actions CI (`ci.yml`), CD (`cd.yml`), checks, maintenance, and Dependabot

#### Scheduling and Allocation

- Wake-time based daily schedule generation
- Hybrid allocation engine: protected blocks, fixed client blocks, weighted distribution, task filling by Eisenhower priority and deadline
- Capacity-aware buffer sizing (percent of flexible pool, `max_buffer_minutes` cap)
- Buffer percentage support in daily settings
- Schedule timestamp consistency (local `YYYY-MM-DDTHH:mm:ss` format)
- Long break flow with proportional client block compression and task bumping
- Re-allocation on return from long breaks with protected blocks preserved
- Day re-planned summary after long break return
- Automatic block progression (pre-completion warnings, auto-complete, extend +5, skip)

#### Chat-First Shell (Phases 13–18)

- Chat thread as primary home at `/` with holographic day telemetry panel
- Deterministic intent router with AI fallback (OpenRouter + Ollama)
- Inline rich attachments: schedule card, task summary, faith streak, focus score, planned vs actual
- Voice input (MediaRecorder + Whisper) and optional TTS
- Proactive greeting, typing delay, contextual quick-reply chips
- Intents: wake time, add task, block actions, long break, faith log, check-in ack, query status/tasks, replan day, Eisenhower priority follow-up

#### Breaks and Alerts

- Centralized notification service (desktop + in-app banner + chat)
- Micro-break popups every ~90 minutes with activity choices
- Long break logging (reason, duration) in `breaks_log`
- Staleness alerts for untouched clients/projects
- Self-resetting per-client check-in countdown during fixed-block windows

#### Tasks and Clients

- Eisenhower Task Matrix: Q1–Q4 quadrants, Inbox (untriaged), optional job assignment
- Natural language quick-add with deadline, estimate, and quadrant parsing
- Dynamic client/project CRUD (name, color, weight, active status, fixed block defaults)
- Protected block configuration (morning_routine, faith, meal, micro_break, winddown)

#### Faith and Journal

- Daily Bible reading reference and prayer notes
- Streak counter with searchable history
- Journal stats: entries this month, longest streak, word count over time

#### Insights and Review

- Daily Insight AI briefing (OpenRouter primary, Ollama fallback, graceful degradation to raw data)
- Advisory-only AI (never auto-modifies schedule)
- Review screen: planned vs actual hours per client, break log analysis, check-in summary
- Settings Test Connection for OpenRouter and Ollama

#### UI Shell

- Dark holographic HUD theme with mint/cyan accents
- Icon rail navigation: Dashboard, Task Matrix, Daily Insight, Journal, Review, Settings
- Top status bar: chrono sync, current block, Faith Streak, focus score, long-break button, notifications
- Scrollable legacy screen layout (Settings, Journal, Review, etc.)

#### Settings

- OpenRouter API key and model selection (`.env` + secrets file, main-process load)
- Ollama endpoint and model configuration
- Notification preferences (micro-break interval, doomscroll allowance duration)
- Protected block, buffer, and display preferences
- Startup background, tray, and launch-at-login options

[Unreleased]: https://github.com/your-org/focus-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/focus-os/releases/tag/v0.1.0
