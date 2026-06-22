import type Database from 'better-sqlite3'
import type { ExternalAccountRow } from '@shared/types/integrations'
import { nowIso } from '@shared/utils/time'

export function listExternalAccounts(
  db: Database.Database,
  provider?: string
): ExternalAccountRow[] {
  if (provider) {
    return db
      .prepare('SELECT * FROM external_accounts WHERE provider = ? ORDER BY id ASC')
      .all(provider) as ExternalAccountRow[]
  }
  return db.prepare('SELECT * FROM external_accounts ORDER BY id ASC').all() as ExternalAccountRow[]
}

export function getExternalAccount(
  db: Database.Database,
  id: number
): ExternalAccountRow | undefined {
  return db.prepare('SELECT * FROM external_accounts WHERE id = ?').get(id) as
    | ExternalAccountRow
    | undefined
}

export function getGoogleAccount(db: Database.Database): ExternalAccountRow | undefined {
  return db
    .prepare('SELECT * FROM external_accounts WHERE provider = ? ORDER BY id ASC LIMIT 1')
    .get('google') as ExternalAccountRow | undefined
}

export function upsertExternalAccount(
  db: Database.Database,
  input: {
    provider: string
    accountEmail: string
    scopes: string
    tokenKeyRef: string
    calendarIdsJson?: string | null
    gmailEnabled?: boolean
    calendarEnabled?: boolean
  }
): ExternalAccountRow {
  const now = nowIso()
  const existing = db
    .prepare('SELECT * FROM external_accounts WHERE provider = ? AND account_email = ?')
    .get(input.provider, input.accountEmail) as ExternalAccountRow | undefined

  if (existing) {
    db.prepare(
      `
      UPDATE external_accounts
      SET scopes = @scopes,
          token_key_ref = @token_key_ref,
          calendar_ids_json = COALESCE(@calendar_ids_json, calendar_ids_json),
          gmail_enabled = COALESCE(@gmail_enabled, gmail_enabled),
          calendar_enabled = COALESCE(@calendar_enabled, calendar_enabled),
          updated_at = @updated_at
      WHERE id = @id
    `
    ).run({
      id: existing.id,
      scopes: input.scopes,
      token_key_ref: input.tokenKeyRef,
      calendar_ids_json: input.calendarIdsJson ?? null,
      gmail_enabled: input.gmailEnabled === undefined ? existing.gmail_enabled : input.gmailEnabled ? 1 : 0,
      calendar_enabled:
        input.calendarEnabled === undefined ? existing.calendar_enabled : input.calendarEnabled ? 1 : 0,
      updated_at: now,
    })
    return getExternalAccount(db, existing.id)!
  }

  const result = db
    .prepare(
      `
      INSERT INTO external_accounts (
        provider, account_email, scopes, token_key_ref, calendar_ids_json,
        gmail_enabled, calendar_enabled, last_sync_at, created_at, updated_at
      ) VALUES (
        @provider, @account_email, @scopes, @token_key_ref, @calendar_ids_json,
        @gmail_enabled, @calendar_enabled, NULL, @created_at, @updated_at
      )
    `
    )
    .run({
      provider: input.provider,
      account_email: input.accountEmail,
      scopes: input.scopes,
      token_key_ref: input.tokenKeyRef,
      calendar_ids_json: input.calendarIdsJson ?? '["primary"]',
      gmail_enabled: input.gmailEnabled === false ? 0 : 1,
      calendar_enabled: input.calendarEnabled === false ? 0 : 1,
      created_at: now,
      updated_at: now,
    })

  return getExternalAccount(db, Number(result.lastInsertRowid))!
}

export function updateExternalAccountSync(
  db: Database.Database,
  id: number,
  lastSyncAt: string
): void {
  db.prepare('UPDATE external_accounts SET last_sync_at = ?, updated_at = ? WHERE id = ?').run(
    lastSyncAt,
    lastSyncAt,
    id
  )
}

export function deleteExternalAccount(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM external_accounts WHERE id = ?').run(id)
}
