import type { BrowserWindow } from 'electron'
import type Database from 'better-sqlite3'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import { insertBriefing, getLatestBriefing } from '../db/repositories/assistantBriefingsRepository'
import { listBlocksForDate } from '../db/repositories/dailyScheduleRepository'
import { listCalendarEventsForDate } from '../db/repositories/calendarEventsRepository'
import { countActionableEmails } from '../db/repositories/emailMessagesRepository'
import { getDailySettings } from '../db/repositories/dailySettingsRepository'
import { notify } from './notificationService'
import { buildExternalDaySummary } from './externalSummaryService'
import { getDatabase } from '../db/connection'
import { parseScheduleInstant } from '@shared/utils/scheduleTimestamp'

let orchestratorInterval: ReturnType<typeof setInterval> | null = null
let mainWindow: BrowserWindow | null = null
const preMeetingNotified = new Set<string>()
let morningNotifiedDate: string | null = null
let lastHourlyBriefingHour: number | null = null

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function displayName(settings: ReturnType<typeof getAllSettings>): string {
  return settings.userDisplayName.trim() || 'there'
}

function buildHourlyBriefing(db: Database.Database, scheduleDate: string): string {
  const settings = getAllSettings(db)
  const blocks = listBlocksForDate(db, scheduleDate)
  const completed = blocks.filter((block) => block.status === 'completed')
  const active = blocks.find((block) => block.status === 'active')
  const next = blocks.find((block) => block.status === 'planned')
  const external = buildExternalDaySummary(db, scheduleDate)
  const actionableEmails = countActionableEmails(db)

  const lines = [
    `**Hourly check-in**`,
    '',
    `Completed ${completed.length} block${completed.length === 1 ? '' : 's'} so far.`,
  ]

  if (active) {
    lines.push(`Active now: **${active.title}**.`)
  }
  if (next) {
    lines.push(`Up next: **${next.title}**.`)
  }
  if (actionableEmails > 0) {
    lines.push(`${actionableEmails} actionable email${actionableEmails === 1 ? '' : 's'} waiting.`)
  }
  if (external.nextCalendarEvent) {
    lines.push(
      `Next calendar event: **${external.nextCalendarEvent.title}** at ${external.nextCalendarEvent.startAt.slice(11, 16)}.`
    )
  }
  if (external.scheduleConflicts.length > 0) {
    lines.push(
      `⚠ ${external.scheduleConflicts.length} schedule/calendar conflict${external.scheduleConflicts.length === 1 ? '' : 's'} detected.`
    )
  }

  lines.push('', 'Say "what\'s next" or "find me a meeting slot" anytime.')
  return lines.join('\n')
}

function buildMorningBriefing(db: Database.Database, scheduleDate: string): string {
  const settings = getAllSettings(db)
  const daily = getDailySettings(db, scheduleDate)
  const name = displayName(settings)

  if (!daily?.wake_time) {
    return `Good morning, ${name}. What time did you wake up? I'll build today's schedule around your calendar and priorities.`
  }

  const events = listCalendarEventsForDate(db, scheduleDate)
  const external = buildExternalDaySummary(db, scheduleDate)

  const lines = [
    `Good morning, ${name}.`,
    '',
    `Wake time logged at **${daily.wake_time}**.`,
    `You have **${events.length}** calendar event${events.length === 1 ? '' : 's'} today.`,
  ]

  if (external.actionableEmailCount > 0) {
    lines.push(`${external.actionableEmailCount} emails may need action.`)
  }

  lines.push('', 'Say "what\'s next" to see your plan.')
  return lines.join('\n')
}

function checkPreMeetingReminders(db: Database.Database): void {
  const settings = getAllSettings(db)
  if (!settings.assistant.preMeetingEnabled || !settings.notifications.preMeeting) {
    return
  }

  const now = new Date()
  const scheduleDate = todayDateString()
  const events = listCalendarEventsForDate(db, scheduleDate)
  const blocks = listBlocksForDate(db, scheduleDate)
  const activeBlock = blocks.find((block) => block.status === 'active')

  for (const event of events) {
    const start = parseScheduleInstant(event.start_at)
    const minutesUntil = (start.getTime() - now.getTime()) / 60_000
    if (minutesUntil < 14 || minutesUntil > 16) {
      continue
    }

    const dedupeKey = `pre_meeting:${event.id}:${scheduleDate}`
    if (preMeetingNotified.has(dedupeKey)) {
      continue
    }
    preMeetingNotified.add(dedupeKey)

    const content = `**${event.title}** starts in 15 minutes.${
      activeBlock ? ` You're on **${activeBlock.title}** — wrap up or extend?` : ''
    }`

    insertBriefing(db, {
      briefingType: 'pre_meeting',
      scheduleDate,
      contentMd: content,
      provider: 'deterministic',
    })

    notify({
      type: 'generic',
      title: 'Upcoming meeting',
      message: `${event.title} in 15 min`,
      urgency: 'high',
      persistent: false,
      dedupeKey,
      showInChat: true,
      metadata: { briefingType: 'pre_meeting', eventId: event.id },
    })
  }
}

function tickOrchestrator(db: Database.Database): void {
  const settings = getAllSettings(db)
  const now = new Date()
  const scheduleDate = todayDateString()
  const hour = now.getHours()

  if (
    settings.assistant.morningEnabled &&
    settings.notifications.assistantBriefing &&
    hour >= settings.assistant.morningHour &&
    morningNotifiedDate !== scheduleDate
  ) {
    morningNotifiedDate = scheduleDate
    const content = buildMorningBriefing(db, scheduleDate)
    insertBriefing(db, {
      briefingType: 'morning',
      scheduleDate,
      contentMd: content,
      provider: 'deterministic',
    })

    notify({
      type: 'generic',
      title: 'Good morning',
      message: `Ready to plan your day, ${displayName(settings)}?`,
      urgency: 'normal',
      persistent: false,
      dedupeKey: `morning:${scheduleDate}`,
      showInChat: true,
      metadata: { briefingType: 'morning', content },
    })
  }

  if (
    settings.assistant.hourlyEnabled &&
    settings.notifications.assistantBriefing &&
    now.getMinutes() === 0 &&
    lastHourlyBriefingHour !== hour
  ) {
    lastHourlyBriefingHour = hour
    const latest = getLatestBriefing(db, 'hourly', scheduleDate)
    const content = buildHourlyBriefing(db, scheduleDate)

    if (!latest || latest.content_md !== content) {
      insertBriefing(db, {
        briefingType: 'hourly',
        scheduleDate,
        contentMd: content,
        provider: 'deterministic',
      })

      notify({
        type: 'generic',
        title: 'Hourly briefing',
        message: 'Your assistant check-in is ready.',
        urgency: 'normal',
        persistent: false,
        dedupeKey: `hourly:${scheduleDate}:${hour}`,
        showInChat: true,
        metadata: { briefingType: 'hourly', content },
      })
    }
  }

  checkPreMeetingReminders(db)
}

export function startAssistantOrchestrator(window: BrowserWindow): void {
  mainWindow = window
  if (orchestratorInterval) {
    return
  }

  const db = getDatabase()
  orchestratorInterval = setInterval(() => tickOrchestrator(db), 60_000)
  tickOrchestrator(db)
}

export function stopAssistantOrchestrator(): void {
  if (orchestratorInterval) {
    clearInterval(orchestratorInterval)
    orchestratorInterval = null
  }
  mainWindow = null
  preMeetingNotified.clear()
  morningNotifiedDate = null
  lastHourlyBriefingHour = null
}

export function buildAssistantBriefing(
  db: Database.Database,
  briefingType: 'morning' | 'hourly',
  scheduleDate = todayDateString()
): string {
  return briefingType === 'morning'
    ? buildMorningBriefing(db, scheduleDate)
    : buildHourlyBriefing(db, scheduleDate)
}
