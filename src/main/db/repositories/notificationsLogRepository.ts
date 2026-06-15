import type Database from 'better-sqlite3'
import type { NotificationType, NotificationUrgency } from '@shared/types/notifications'

export interface NotificationLogRow {
  id: number
  type: NotificationType
  title: string
  message: string
  created_at: string
  acknowledged_at: string | null
  urgency: NotificationUrgency
}

export interface InsertNotificationInput {
  type: NotificationType
  title: string
  message: string
  urgency: NotificationUrgency
  created_at: string
}

export function insertNotification(
  db: Database.Database,
  input: InsertNotificationInput
): NotificationLogRow {
  const result = db
    .prepare(
      `
      INSERT INTO notifications_log (type, title, message, created_at, urgency)
      VALUES (@type, @title, @message, @created_at, @urgency)
    `
    )
    .run(input)

  const row = getNotificationById(db, Number(result.lastInsertRowid))
  if (!row) {
    throw new Error('NOTIFICATION_INSERT_FAILED')
  }

  return row
}

export function getNotificationById(
  db: Database.Database,
  id: number
): NotificationLogRow | null {
  return (
    db
      .prepare(
        `
      SELECT id, type, title, message, created_at, acknowledged_at, urgency
      FROM notifications_log
      WHERE id = ?
    `
      )
      .get(id) as NotificationLogRow | undefined
  ) ?? null
}

export function acknowledgeNotification(
  db: Database.Database,
  id: number,
  acknowledgedAt: string
): NotificationLogRow | null {
  db.prepare(
    `
    UPDATE notifications_log
    SET acknowledged_at = @acknowledged_at
    WHERE id = @id AND acknowledged_at IS NULL
  `
  ).run({ id, acknowledged_at: acknowledgedAt })

  return getNotificationById(db, id)
}

export function listUnacknowledgedNotifications(db: Database.Database): NotificationLogRow[] {
  return db
    .prepare(
      `
      SELECT id, type, title, message, created_at, acknowledged_at, urgency
      FROM notifications_log
      WHERE acknowledged_at IS NULL
      ORDER BY created_at ASC
    `
    )
    .all() as NotificationLogRow[]
}
