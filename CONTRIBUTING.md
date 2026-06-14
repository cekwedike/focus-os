# Contributing Guidelines

Focus OS is a solo project for now. This document serves as personal working guidelines: how to commit, branch, document features, and self-review before merging or tagging releases. When collaborators join later, these conventions can expand without changing the core habits.

## Philosophy

- Document before building non-trivial features.
- Keep the allocation engine deterministic and testable; AI stays advisory.
- Small, reviewable commits beat large dumps.
- Update roadmap and prompt log so future sessions (human or AI) retain context.

## Branch Naming (When Used)

Main branch: `main` (protected working baseline).

Optional feature branches for isolated work:

| Pattern | Example | Use when |
|---------|---------|----------|
| `phase/N-short-name` | `phase/4-allocation-engine` | Roadmap phase work |
| `fix/short-description` | `fix/break-reallocation-edge-case` | Bug fixes |
| `docs/short-description` | `docs/schema-v2-notes` | Documentation only |

For rapid solo iteration, committing directly to `main` is acceptable if changes are small and tested. Use branches for risky refactors or experimental spikes.

## Commit Message Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) in imperative mood:

```
<type>(<optional scope>): <short summary>

<optional body>

<optional footer>
```

### Types

| Type | When |
|------|------|
| `feat` | New user-facing capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change without behavior change |
| `test` | Tests only |
| `chore` | Tooling, deps, build config |
| `perf` | Performance improvement |

### Scopes (examples)

`schedule`, `allocation`, `tasks`, `journal`, `insight`, `settings`, `db`, `ipc`, `ui`, `packaging`

### Examples

```
feat(schedule): generate daily blocks from wake time input

fix(allocation): bump low-priority tasks when block below minimum

docs(schema): document breaks_log indexes

chore(deps): upgrade electron to 33.x
```

### Rules

- Summary line: 72 characters or fewer.
- Body explains **why**, not just what.
- Reference roadmap phase in body when relevant: `Phase 5: Daily Workspace wake-time modal`.

## Documenting New Features Before Building

Before implementing anything beyond a trivial fix:

1. **Check roadmap**: Feature should map to a phase in [ROADMAP.md](./ROADMAP.md). If not, add a note or new sub-item first.
2. **Update specs if behavior changes**:
   - Scheduling logic → [ALLOCATION_ENGINE.md](./ALLOCATION_ENGINE.md)
   - Database changes → [SCHEMA.md](./SCHEMA.md) + migration
   - New module or IPC → [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Security impact** → [SECURITY.md](./SECURITY.md) if new external calls or data exposure.
4. **AI behavior** → Explicitly state "advisory only" in spec; no auto-schedule mutations.

For small UI-only tweaks inside an existing spec, a commit message and prompt log entry may suffice.

## Development Workflow

1. Pull latest `main` (or sync local).
2. Read relevant docs and current phase status.
3. Implement with TypeScript strict mode and [rules.md](./rules.md).
4. Run tests and lint.
5. Self-review (checklist below).
6. Commit with conventional message.
7. Update CHANGELOG `[Unreleased]` for user-visible changes.
8. Mark roadmap phase progress; append [PROMPTS_LOG.md](./PROMPTS_LOG.md) for significant Cursor sessions.

## Self-Review Checklist

Run this before every non-trivial commit or phase completion.

### Correctness

- [ ] Behavior matches ALLOCATION_ENGINE.md / SCHEMA.md / acceptance criteria for the phase
- [ ] Edge cases considered: empty clients, zero wake-time remainder, all tasks completed, long break near end of day
- [ ] AI features do not write to schedule tables without explicit user action

### Code Quality

- [ ] TypeScript strict; no unjustified `any`
- [ ] No source file exceeds 1000 lines; split at ~800 lines proactively
- [ ] No truncated code in commits or AI-generated output
- [ ] No duplicated logic that belongs in shared/allocation or shared utilities
- [ ] Naming: PascalCase components, camelCase functions, snake_case DB fields
- [ ] No em dashes or horizontal rules (`---`) in docs, comments, or generated text

### Architecture

- [ ] SQLite access only in main process
- [ ] IPC types shared in `src/shared`
- [ ] Allocation engine remains pure/testable where specified

### Security and Privacy

- [ ] No API keys or `.env` committed
- [ ] No new outbound network calls without SECURITY.md awareness
- [ ] Personal data paths gitignored

### UX

- [ ] Dark theme and mint accent consistent
- [ ] Loading and error states for async IPC/AI calls
- [ ] Notifications respect settings

### Tests and Docs

- [ ] Unit tests for allocation and critical paths updated or added
- [ ] CHANGELOG updated if user-visible
- [ ] ROADMAP phase status accurate

## Release Checklist (0.1.0 and Beyond)

- [ ] All planned phase items for version complete
- [ ] CHANGELOG version section dated
- [ ] Version bumped in `package.json`
- [ ] `npm run build` and `npm run package:win` succeed
- [ ] Smoke test on clean Windows VM or machine
- [ ] Tag: `git tag v0.1.0`

## Code Style

- ESLint + Prettier at scaffold (config TBD).
- Match existing patterns in neighboring files.
- Comments only for non-obvious business logic (see rules.md).

## Questions and Decisions

Ambiguous product decisions: document the chosen approach in PROMPTS_LOG or inline in the relevant spec, then implement. Do not silently guess on allocation rules or schema changes.

## Related Documents

- [rules.md](./rules.md)
- [ROADMAP.md](./ROADMAP.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
- [PROMPTS_LOG.md](./PROMPTS_LOG.md)
