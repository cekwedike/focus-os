# Changelog

All notable changes to Focus OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Version numbering starts at **0.1.0** for the first functional release. Semantic versioning applies from 0.1.0 onward. During pre-1.0 development, minor versions may include breaking changes as the architecture stabilizes.

## [Unreleased]

## [0.1.0] - 2026-06-14

First functional release. Completes the initial 12-phase roadmap.

### Added

#### Core Platform

- Electron + React + TypeScript + Tailwind CSS application scaffold
- Windows NSIS installer via electron-builder (`pnpm build:exe`)
- better-sqlite3 local database with full schema (9 tables)
- Main/renderer IPC layer for database, timers, and notifications

#### Scheduling and Allocation

- Wake-time based daily schedule generation
- Hybrid allocation engine: protected blocks, fixed client blocks, weighted distribution, task filling by priority and deadline
- Buffer percentage support in daily settings
- Long break flow with proportional client block compression and task bumping
- Re-allocation on return from long breaks with protected blocks preserved
- Day re-planned summary after long break return

#### Breaks and Alerts

- Micro-break popups every ~90 minutes with activity choices (read, walk, call, messages, doomscroll)
- Long break logging (reason, duration) in `breaks_log`
- Staleness alerts for untouched clients/projects (notifications only, never overrides schedule)

#### Tasks and Clients

- Dynamic client/project CRUD (name, color, weight, active status, fixed block defaults)
- Task Matrix with filters and natural language quick-add
- Protected block configuration (morning_routine, faith, meal, micro_break, winddown)

#### Faith and Journal

- Daily Bible reading reference and prayer notes
- Streak counter with searchable history
- Journal stats: entries this month, longest streak, word count over time

#### Insights and Review

- Daily Insight AI briefing (OpenRouter primary, Ollama fallback, graceful degradation to raw data)
- Advisory-only AI (never auto-modifies schedule)
- Review screen: planned vs actual hours per client, break log analysis
- Settings Test Connection for OpenRouter and Ollama

#### UI Shell

- Dark theme with mint green (`#2DD4A0`) accent
- Sidebar navigation: Dashboard, Daily Workspace, Task Matrix, Schedule, Daily Insight, Journal, Review, Settings
- Top status bar: current time/block, Faith Streak, focus score, long-break button, notifications

#### Settings

- OpenRouter API key and model selection (main-process secrets file)
- Ollama endpoint and model configuration
- Notification preferences (micro-break interval, doomscroll allowance duration)
- Protected block and buffer preferences

[Unreleased]: https://github.com/your-org/focus-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/focus-os/releases/tag/v0.1.0
