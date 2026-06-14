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
