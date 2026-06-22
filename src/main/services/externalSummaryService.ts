import type Database from 'better-sqlite3'
import {
  countActionableEmails,
  listActionableEmails,
} from '../db/repositories/emailMessagesRepository'
import {
  getNextCalendarEvent,
  listCalendarEventsForDate,
} from '../db/repositories/calendarEventsRepository'
import { listBlocksForDate } from '../db/repositories/dailyScheduleRepository'
import { detectScheduleConflicts } from '@shared/availability'
import type { ExternalDaySummary, SuggestedEmailTask } from '@shared/types/integrations'
import { listClients } from '../db/repositories/clientsRepository'

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function nowLocalIso(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

export function buildExternalDaySummary(
  db: Database.Database,
  scheduleDate = todayDateString()
): ExternalDaySummary {
  const nowIso = nowLocalIso()
  const nextEvent = getNextCalendarEvent(db, nowIso)
  const eventsToday = listCalendarEventsForDate(db, scheduleDate)
  const scheduleBlocks = listBlocksForDate(db, scheduleDate)

  return {
    nextCalendarEvent: nextEvent
      ? {
          id: nextEvent.id,
          title: nextEvent.title,
          startAt: nextEvent.start_at,
          endAt: nextEvent.end_at,
          location: nextEvent.location,
        }
      : null,
    actionableEmailCount: countActionableEmails(db),
    upcomingEventsToday: eventsToday.length,
    scheduleConflicts: detectScheduleConflicts(scheduleBlocks, eventsToday),
  }
}

export function listSuggestedEmailTasks(db: Database.Database): SuggestedEmailTask[] {
  const clients = listClients(db)
  const emails = listActionableEmails(db)

  return emails.map((email) => {
    const client = clients.find((row) => row.id === email.suggested_client_id)
    return {
      emailId: email.id,
      subject: email.subject,
      fromAddress: email.from_address,
      snippet: email.snippet,
      suggestedTitle: email.subject.replace(/^(re:|fwd:)\s*/i, '').slice(0, 120),
      suggestedClientId: email.suggested_client_id,
      suggestedClientName: client?.name ?? null,
      suggestedPriority: email.suggested_priority ?? 2,
      suggestedDeadline: email.suggested_deadline,
      triageSummary: email.triage_summary ?? 'Action may be required',
    }
  })
}
