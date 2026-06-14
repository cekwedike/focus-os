# CI/CD

Focus OS is a desktop Electron app shipped as a Windows `.exe`, not a hosted web service. Continuous integration catches regressions early on every push. Continuous delivery builds and publishes the installer only when you cut a versioned release.

This document describes the GitHub Actions setup in `.github/workflows/`. Workflows use **pnpm** with a committed `pnpm-lock.yaml`.

## Philosophy

Focus OS is a solo, local-first project. CI/CD stays minimal on purpose:

- **Every push and PR to `main`**: fast checks only (type check, lint, unit tests). No exe build.
- **Version tags only** (`v*.*.*`): full release pipeline builds the Windows artifact and attaches it to the GitHub Release.

Building an exe on every commit would be slow, expensive, and unnecessary while most work is docs and incremental features.

## Branching Strategy

Aligned with [CONTRIBUTING.md](./CONTRIBUTING.md):

| Branch | Role |
|--------|------|
| `main` | Protected baseline; CI runs on push and on PRs targeting `main` |
| `phase/N-short-name` | Optional isolated roadmap work |
| `fix/short-description` | Bug fixes |
| `docs/short-description` | Documentation-only changes |

Solo iteration may commit directly to `main` for small, tested changes. Use feature branches when work is risky or spans multiple sessions.

Pull requests into `main` should pass CI before merge. Even on a solo project, opening a PR (or at least running checks locally) catches issues before they land on `main`.

## Continuous Integration (`ci.yml`)

**Triggers:** `push` to `main`, `pull_request` targeting `main`.

**Runner:** `ubuntu-latest` (fast, sufficient for TypeScript lint, type check, and pure unit tests).

**Steps:**

1. Checkout repository
2. Setup pnpm v9 and Node.js **v20** (see [DEVELOPMENT.md](./DEVELOPMENT.md))
3. `pnpm install --frozen-lockfile`
4. `pnpm typecheck` (TypeScript compiler, no emit)
5. `pnpm lint` (ESLint)
6. `pnpm test` (unit tests; allocation engine and migration coverage per [ARCHITECTURE.md](./ARCHITECTURE.md))

### What CI Validates

| Check | Purpose |
|-------|---------|
| TypeScript | Strict types across main, preload, renderer, and shared modules |
| ESLint | Style, common bugs, and project rules |
| Unit tests | Deterministic allocation engine behavior, utilities, and other pure logic |

CI does **not** build Electron, run integration tests against SQLite, or produce an exe. Those belong to local dev and the release workflow.

### Expected pnpm Scripts

| Script | Command (typical) |
|--------|-------------------|
| `typecheck` | `tsc --noEmit` (node + web tsconfigs) |
| `lint` | `eslint .` |
| `test` | `vitest run` |

### Native Modules Note

`better-sqlite3` is compiled for Electron's Node ABI via `postinstall` and `predev` (`electron-builder install-app-deps`). Unit tests run through `scripts/run-vitest-electron.mjs`, which executes Vitest with `ELECTRON_RUN_AS_NODE=1` so the same native binary works in tests and in the app without a second compile pass.

## Continuous Delivery (`release.yml`)

**Triggers:** `push` of tags matching `v*.*.*` (e.g. `v0.1.0`, `v0.2.1`).

**Runner:** `windows-latest` (required for electron-builder Windows `.exe` output).

**Steps:**

1. Checkout repository
2. Setup pnpm v9 and Node.js v20
3. `pnpm install --frozen-lockfile`
4. Safety gate: same checks as CI (`typecheck`, `lint`, `test`)
5. `pnpm build:exe` (production build + electron-builder Windows target)
6. Upload `.exe` (and optional `.exe.blockmap` if generated) to the GitHub Release for that tag

### Versioning and CHANGELOG

Releases follow [Semantic Versioning](https://semver.org/) and [CHANGELOG.md](./CHANGELOG.md):

1. Complete features for the target version under `[Unreleased]`
2. Move entries to a dated `[X.Y.Z]` section in CHANGELOG
3. Bump `version` in `package.json` to match
4. Commit on `main`
5. Tag: `git tag v0.1.0` and `git push origin v0.1.0`
6. `release.yml` runs automatically and attaches artifacts to the GitHub Release

The exe version string should match the git tag and CHANGELOG entry (electron-builder reads `package.json` version).

**Tag format:** `vMAJOR.MINOR.PATCH` only. Do not tag `0.1.0` without the `v` prefix; the workflow pattern expects `v*.*.*`.

### Expected Release Script (Phase 1)

| Script | Purpose |
|--------|---------|
| `build:exe` | Runs production `build` then `electron-builder` for Windows (may wrap existing `package:win`) |

Artifact output (NSIS installer):

```
release/Focus OS Setup 0.1.0.exe
release/Focus OS Setup 0.1.0.exe.blockmap
```

The release workflow uploads `release/*.exe` and `release/*.exe.blockmap`.

### Creating the GitHub Release

The release workflow uses `softprops/action-gh-release` to create or update the GitHub Release for the pushed tag and upload build artifacts. You do not need to draft the release manually in the GitHub UI before pushing the tag, though you may add release notes afterward.

## Local Pre-Push Checklist

Before pushing to `main` or opening a PR, run the same checks CI will run:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

For changes touching packaging or native modules, also verify locally on Windows:

```bash
pnpm build:exe
```

Use the full self-review checklist in [CONTRIBUTING.md](./CONTRIBUTING.md): allocation behavior, file size limits, naming conventions, no secrets committed, and AI features remaining advisory-only.

Optional but recommended before a release tag:

- [ ] CHANGELOG section dated and version bumped in `package.json`
- [ ] `pnpm audit` reviewed ([SECURITY.md](./SECURITY.md))
- [ ] Smoke test on a clean Windows machine (Phase 12 exit criteria)
- [ ] ROADMAP Phase 12 items complete or explicitly deferred with notes in PROMPTS_LOG

## Workflow Files

| File | Trigger | Runner |
|------|---------|--------|
| [.github/workflows/ci.yml](./.github/workflows/ci.yml) | Push/PR to `main` | `ubuntu-latest` |
| [.github/workflows/release.yml](./.github/workflows/release.yml) | Tag `v*.*.*` | `windows-latest` |

## Secrets and Environment

CI and release workflows do **not** need `OPENROUTER_API_KEY` or other AI secrets. Builds and tests must pass without network AI access.

If code signing is added later, store the certificate password and thumbprint in GitHub Actions secrets and reference them in `release.yml`. Unsigned builds are the default for v0.1.0.

## Future Considerations

### Code Signing (not in v0.1.0)

Windows executables built without an Authenticode certificate will trigger **Windows SmartScreen** warnings ("Windows protected your PC") until the file builds enough reputation or users click through explicitly. This is expected for early solo releases.

Future options:

- Purchase an EV or standard code signing certificate
- Sign in `release.yml` via `electron-builder` `win.certificateFile` / `certificatePassword` secrets
- Document install instructions for users (right-click, Properties, Unblock, or "More info" then "Run anyway")

### Auto-Update (not in v1)

electron-updater or a custom update channel is out of scope for 0.1.0. Users install new versions manually from GitHub Releases. Revisit after packaging stabilizes and signing is in place.

### Expanded CI (later)

Possible additions without changing the minimal default:

- Windows job on PR when `better-sqlite3` integration tests land
- `pnpm audit --audit-level=high` as a non-blocking or blocking step
- Artifact upload of unsigned exe on `main` for manual QA (nightly or manual workflow_dispatch)
- macOS/Linux builders if platforms expand beyond Windows

## Related Documents

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [ROADMAP.md](./ROADMAP.md) (Phase 12)
- [SECURITY.md](./SECURITY.md)
