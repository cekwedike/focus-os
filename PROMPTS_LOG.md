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

### 2026-06-14: Foundational documentation

**Prompt summary:** Create all foundational markdown and config files for Focus OS before any application code: README, CHANGELOG, DEVELOPMENT, CONTRIBUTING, rules, ARCHITECTURE, SCHEMA, ALLOCATION_ENGINE, ROADMAP, PROMPTS_LOG, SECURITY, `.env.example`, and `.gitignore`. Full content based on project overview (Electron + React + TS desktop executive assistant for freelancers).

**Outcome:** Complete documentation suite written and aligned to project standards (1000-line file limit, no horizontal rules or em dashes in generated content). No application code scaffolded. Roadmap phases 1-12 marked Not Started. Schema defined for 9 SQLite tables. Hybrid allocation engine specified step-by-step including day re-planned summary. AI standards and security practices documented.

**Files / phases:** README.md, CHANGELOG.md, DEVELOPMENT.md, CONTRIBUTING.md, rules.md, ARCHITECTURE.md, SCHEMA.md, ALLOCATION_ENGINE.md, ROADMAP.md, PROMPTS_LOG.md, SECURITY.md, .env.example, .gitignore. Pre-Phase 1.

**Follow-ups:** Begin Phase 1 (Electron + React + TS + Tailwind scaffold with sidebar and top bar shell).
