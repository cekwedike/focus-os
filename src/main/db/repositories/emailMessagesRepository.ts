import type Database from 'better-sqlite3'
import type { EmailMessageRow } from '@shared/types/integrations'
import { nowIso } from '@shared/utils/time'

export function listActionableEmails(
  db: Database.Database,
  accountId?: number
): EmailMessageRow[] {
  if (accountId) {
    return db
      .prepare(
        `
        SELECT * FROM email_messages
        WHERE account_id = ?
          AND is_actionable = 1
          AND linked_task_id IS NULL
        ORDER BY received_at DESC
      `
      )
      .all(accountId) as EmailMessageRow[]
  }

  return db
    .prepare(
      `
      SELECT * FROM email_messages
      WHERE is_actionable = 1 AND linked_task_id IS NULL
      ORDER BY received_at DESC
    `
    )
    .all() as EmailMessageRow[]
}

export function countActionableEmails(db: Database.Database): number {
  const row = db
    .prepare(
      'SELECT COUNT(*) AS count FROM email_messages WHERE is_actionable = 1 AND linked_task_id IS NULL'
    )
    .get() as { count: number }
  return row.count
}

export function listRecentEmails(
  db: Database.Database,
  sinceIso: string,
  accountId?: number
): EmailMessageRow[] {
  if (accountId) {
    return db
      .prepare(
        'SELECT * FROM email_messages WHERE account_id = ? AND received_at >= ? ORDER BY received_at DESC'
      )
      .all(accountId, sinceIso) as EmailMessageRow[]
  }
  return db
    .prepare('SELECT * FROM email_messages WHERE received_at >= ? ORDER BY received_at DESC')
    .all(sinceIso) as EmailMessageRow[]
}

export function getEmailMessage(db: Database.Database, id: number): EmailMessageRow | undefined {
  return db.prepare('SELECT * FROM email_messages WHERE id = ?').get(id) as
    | EmailMessageRow
    | undefined
}

export function upsertEmailMessage(
  db: Database.Database,
  input: Omit<EmailMessageRow, 'id' | 'synced_at'> & { synced_at?: string }
): EmailMessageRow {
  const syncedAt = input.synced_at ?? nowIso()
  const existing = db
    .prepare('SELECT id FROM email_messages WHERE account_id = ? AND external_id = ?')
    .get(input.account_id, input.external_id) as { id: number } | undefined

  if (existing) {
    db.prepare(
      `
      UPDATE email_messages
      SET thread_id = @thread_id,
          subject = @subject,
          from_address = @from_address,
          received_at = @received_at,
          snippet = @snippet,
          is_read = @is_read,
          synced_at = @synced_at
      WHERE id = @id
    `
    ).run({
      id: existing.id,
      thread_id: input.thread_id,
      subject: input.subject,
      from_address: input.from_address,
      received_at: input.received_at,
      snippet: input.snippet,
      is_read: input.is_read,
      synced_at: syncedAt,
    })
    return db.prepare('SELECT * FROM email_messages WHERE id = ?').get(existing.id) as EmailMessageRow
  }

  const result = db
    .prepare(
      `
      INSERT INTO email_messages (
        external_id, account_id, thread_id, subject, from_address, received_at,
        snippet, is_read, is_actionable, triage_summary, suggested_client_id,
        suggested_priority, suggested_deadline, linked_task_id, synced_at
      ) VALUES (
        @external_id, @account_id, @thread_id, @subject, @from_address, @received_at,
        @snippet, @is_read, @is_actionable, @triage_summary, @suggested_client_id,
        @suggested_priority, @suggested_deadline, @linked_task_id, @synced_at
      )
    `
    )
    .run({ ...input, synced_at: syncedAt })

  return db
    .prepare('SELECT * FROM email_messages WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as EmailMessageRow
}

export function updateEmailTriage(
  db: Database.Database,
  id: number,
  triage: {
    isActionable: boolean
    triageSummary: string
    suggestedClientId?: number | null
    suggestedPriority?: number | null
    suggestedDeadline?: string | null
  }
): void {
  db.prepare(
    `
    UPDATE email_messages
    SET is_actionable = @is_actionable,
        triage_summary = @triage_summary,
        suggested_client_id = @suggested_client_id,
        suggested_priority = @suggested_priority,
        suggested_deadline = @suggested_deadline
    WHERE id = @id
  `
  ).run({
    id,
    is_actionable: triage.isActionable ? 1 : 0,
    triage_summary: triage.triageSummary,
    suggested_client_id: triage.suggestedClientId ?? null,
    suggested_priority: triage.suggestedPriority ?? null,
    suggested_deadline: triage.suggestedDeadline ?? null,
  })
}

export function linkEmailToTask(db: Database.Database, emailId: number, taskId: number): void {
  db.prepare('UPDATE email_messages SET linked_task_id = ? WHERE id = ?').run(taskId, emailId)
}

export function listUntriagedEmails(db: Database.Database, accountId: number): EmailMessageRow[] {
  return db
    .prepare(
      `
      SELECT * FROM email_messages
      WHERE account_id = ? AND is_actionable IS NULL
      ORDER BY received_at DESC
      LIMIT 50
    `
    )
    .all(accountId) as EmailMessageRow[]
}
