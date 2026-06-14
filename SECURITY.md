# Security

Focus OS is a **fully local, offline-first** desktop application. User data lives on disk in SQLite under the Electron user data directory. The app is designed to function without network access except when the user optionally enables Daily Insight via OpenRouter.

## Data Residency Summary

| Data | Location | Leaves device? |
|------|----------|----------------|
| Clients, tasks, schedules | Local SQLite | No |
| Faith/journal entries | Local SQLite | No |
| Break logs, settings | Local SQLite | No |
| OpenRouter API key | `secrets.json` in userData, or `.env` for dev | No (used only for outbound API calls) |
| Daily Insight prompts | Built at runtime | **Yes**, only when OpenRouter is used |
| Ollama requests | Localhost HTTP | **No** (stays on machine) |

## Network Exposure

### Default (no AI configured)

No outbound network required. Timers, notifications, and scheduling run entirely on device.

### OpenRouter (optional, primary AI)

When `OPENROUTER_API_KEY` is set and Daily Insight is triggered:

- HTTPS request to OpenRouter with model id from config
- Payload contains **synthesized snapshots**, not full database export

### Ollama (optional, fallback)

When OpenRouter is unavailable or unconfigured and Ollama endpoint is reachable:

- HTTP to user-configured host (default `http://localhost:11434`)
- Traffic does not leave the machine if Ollama runs locally

## OpenRouter API Key Storage

**Never commit API keys to the repository.**

### Primary storage: userData secrets file

In the packaged app, the OpenRouter API key is stored in a separate secrets file under Electron's userData directory (not in SQLite, not in `app_settings`):

- **Path:** `{userData}/secrets.json` (alongside `focus-os.db`)
- **Access:** Main process only via `secretsService.ts`
- **Renderer:** Sees only a boolean `configured` state; can set or clear a key via IPC but never reads the full value back
- **Logging:** The key value must never appear in logs, IPC responses to the renderer, or error messages

The secrets file lives outside the project repository (userData is per-machine). Treat it like the database: do not commit, sync to public repos, or back up to untrusted locations without encryption.

### Development fallback

1. **Development:** Store in `.env` at project root (gitignored) as `OPENROUTER_API_KEY`. Main process checks env before the secrets file.
2. **Production / packaged app:** User sets key in Settings (secrets file) or via environment variable at launch.
3. **Do not** persist plain-text API keys in the `app_settings` SQLite table.
4. Reference env key in code as `process.env.OPENROUTER_API_KEY` (main process only); never expose to renderer or preload.
5. Add `.env` to `.gitignore`; provide `.env.example` without real values.

### Non-secret settings in SQLite

OpenRouter model id, Ollama endpoint, buffer defaults, and notification preferences are stored in `app_settings` because they are not credentials.

If a key is accidentally committed: rotate it immediately at OpenRouter, remove from git history if needed, and treat the old key as compromised.

## What Data Is Sent in AI Prompts

Daily Insight prompt construction (see [ARCHITECTURE.md](./ARCHITECTURE.md)) may include:

- **Schedule snapshot**: Block types, times, client names, durations for today
- **Tasks**: Titles, priorities, deadlines, status (not necessarily full descriptions)
- **Staleness**: Client names and hours since last touch
- **Faith summary**: Streak count, whether yesterday had an entry, optional short excerpt (not full historical journal)
- **Yesterday metrics**: Planned vs actual hours per client (aggregated numbers)

Does **not** intentionally include:

- OpenRouter API key or internal file paths
- Unrelated historical journal text beyond configured summary
- System usernames or machine identifiers (unless user typed them into client names)

Users should treat OpenRouter as a **third-party processor** for whatever they have entered into the app (client names, task titles, prayer notes summaries). For maximum privacy, use Ollama-only mode.

## Local Database and Personal Data

- Database file: typically `%APPDATA%/focus-os/focus-os.db` on Windows (exact path via `app.getPath('userData')`).
- Contains all personal productivity and faith journal content.
- **Gitignore** patterns: `*.db`, `*.sqlite`, `*.sqlite3`, and dev overrides.
- Back up userData folder for personal backups; do not sync to public repos.

## Renderer Security (Electron)

- `contextIsolation: true`, `nodeIntegration: false`
- Preload exposes minimal IPC API
- No direct SQLite or filesystem access from React
- Sanitize rendered markdown in Daily Insight if using HTML renderer (XSS from AI output); prefer safe markdown renderer

## Dependencies

- Run **`npm audit`** regularly during development and before releases.
- Address high/critical vulnerabilities in direct dependencies when fixes exist.
- Pin Electron and better-sqlite3 versions; rebuild native modules after upgrades.
- Review licenses of new packages before adding.

## IPC and Input Validation

- Validate all IPC payloads in main process (types, bounds, date formats).
- Reject SQL from renderer; use parameterized queries only in repository layer.
- Limit prompt size sent to AI to reasonable token bounds to avoid accidental huge exports.

## Updates and Signing

- Phase 12 packaging should use code signing when certificates are available (Windows SmartScreen trust).
- Document update strategy (manual reinstall for 0.1.0; auto-update out of scope initially).

## Reporting Issues

Solo project: track security concerns in private notes or issues. If the project becomes public, add a contact method for responsible disclosure.

## Checklist Before Release

- [ ] `.env` and `*.db` in `.gitignore`
- [ ] No API keys in source or committed config
- [ ] API key stored in secrets file or env, not in SQLite
- [ ] AI cannot write schedule without user action
- [ ] `npm audit` reviewed
- [ ] SECURITY.md reviewed if new network endpoints added

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [.env.example](./.env.example)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
