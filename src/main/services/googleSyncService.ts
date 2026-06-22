import type Database from 'better-sqlite3'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import {
  deleteStaleCalendarEvents,
  upsertCalendarEvent,
} from '../db/repositories/calendarEventsRepository'
import {
  getGoogleAccount,
  updateExternalAccountSync,
} from '../db/repositories/externalAccountsRepository'
import { upsertEmailMessage } from '../db/repositories/emailMessagesRepository'
import { fetchCalendarEvents } from '../integrations/google/calendarClient'
import { fetchRecentInboxMessages } from '../integrations/google/gmailClient'
import { triageUntriagedEmails } from './emailTriageService'
import { nowIso } from '@shared/utils/time'

let syncInterval: ReturnType<typeof setInterval> | null = null

function rangeForSync(daysBack = 1, daysForward = 7): { start: string; end: string } {
  const start = new Date()
  start.setDate(start.getDate() - daysBack)
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setDate(end.getDate() + daysForward)
  end.setHours(23, 59, 59, 999)

  const format = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }

  return { start: format(start), end: format(end) }
}

export async function syncGoogleAccount(db: Database.Database): Promise<{
  calendarCount: number
  emailCount: number
}> {
  const account = getGoogleAccount(db)
  if (!account) {
    return { calendarCount: 0, emailCount: 0 }
  }

  const settings = getAllSettings(db)
  const syncStartedAt = nowIso()
  let calendarCount = 0
  let emailCount = 0

  const calendarIds = JSON.parse(account.calendar_ids_json ?? '["primary"]') as string[]

  if (account.calendar_enabled === 1 && settings.google.calendarEnabled) {
    const { start, end } = rangeForSync()
    const events = await fetchCalendarEvents(account.token_key_ref, calendarIds, start, end)

    for (const event of events) {
      upsertCalendarEvent(db, {
        external_id: event.externalId,
        account_id: account.id,
        calendar_id: event.calendarId,
        title: event.title,
        start_at: event.startAt,
        end_at: event.endAt,
        is_all_day: event.isAllDay ? 1 : 0,
        attendees_json: event.attendeesJson,
        location: event.location,
      })
      calendarCount += 1
    }

    deleteStaleCalendarEvents(db, account.id, syncStartedAt)
  }

  if (account.gmail_enabled === 1 && settings.google.gmailEnabled) {
    const since = new Date()
    since.setHours(since.getHours() - 24)
    const messages = await fetchRecentInboxMessages(account.token_key_ref, since.toISOString())

    for (const message of messages) {
      upsertEmailMessage(db, {
        external_id: message.externalId,
        account_id: account.id,
        thread_id: message.threadId,
        subject: message.subject,
        from_address: message.fromAddress,
        received_at: message.receivedAt,
        snippet: message.snippet,
        is_read: message.isRead ? 1 : 0,
        is_actionable: null,
        triage_summary: null,
        suggested_client_id: null,
        suggested_priority: null,
        suggested_deadline: null,
        linked_task_id: null,
      })
      emailCount += 1
    }

    await triageUntriagedEmails(db, account.id)
  }

  updateExternalAccountSync(db, account.id, nowIso())
  return { calendarCount, emailCount }
}

export function startGoogleSyncService(db: Database.Database): void {
  if (syncInterval) {
    return
  }

  const settings = getAllSettings(db)
  const intervalMs = Math.max(5, settings.googleSyncIntervalMinutes) * 60_000

  const run = (): void => {
    void syncGoogleAccount(db).catch((error) => {
      console.error('[googleSync] sync failed', error)
    })
  }

  run()
  syncInterval = setInterval(run, intervalMs)
}

export function stopGoogleSyncService(): void {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

export function restartGoogleSyncService(db: Database.Database): void {
  stopGoogleSyncService()
  startGoogleSyncService(db)
}
