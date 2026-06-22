import type { BrowserWindow } from 'electron'
import { assistantLexicon } from '@shared/copy/assistantLexicon'
import { getDatabase } from '../db/connection'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import {
  findNextPlannedBlock,
  getActiveBlock,
  listBlocksForDate,
} from '../db/repositories/dailyScheduleRepository'
import { notify } from './notificationService'
import { tryActivateDueBlock } from './blockProgressionService'
import {
  getSnoozedBlockIds,
  isAutoStartPaused,
  snoozeBlock,
  pauseAutoStart,
} from './autoStartService'
import { buildExternalDaySummary } from './externalSummaryService'

let narratorInterval: ReturnType<typeof setInterval> | null = null
let mainWindow: BrowserWindow | null = null
const countdownSent = new Set<string>()

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function narrate(payload: {
  message: string
  dedupeKey: string
  actions?: Array<{ id: string; label: string }>
  metadata?: Record<string, unknown>
}): void {
  notify({
    type: 'generic',
    title: assistantLexicon.appName,
    message: payload.message,
    urgency: 'normal',
    persistent: false,
    dedupeKey: payload.dedupeKey,
    showInChat: true,
    actions: payload.actions ?? [],
    metadata: { content: payload.message, ...payload.metadata },
  })
}

function blockDurationMinutes(plannedStart: string, plannedEnd: string): number {
  const start = new Date(plannedStart).getTime()
  const end = new Date(plannedEnd).getTime()
  return Math.max(1, Math.round((end - start) / 60_000))
}

export function narrateBlockStarted(block: {
  id: number
  title: string
  planned_start: string
  planned_end: string
}): void {
  const minutes = blockDurationMinutes(block.planned_start, block.planned_end)
  let message = assistantLexicon.blockStarted(block.title, minutes)

  try {
    const external = buildExternalDaySummary(getDatabase())
    if (external.actionableEmailCount > 0) {
      message += ` ${external.actionableEmailCount} actionable email${external.actionableEmailCount === 1 ? '' : 's'} waiting when you're done.`
    }
  } catch {
    // ignore
  }

  narrate({
    message,
    dedupeKey: `block_started:${block.id}:${todayDateString()}`,
    metadata: {
      briefingType: 'block_start',
      blockId: block.id,
      attachmentType: 'now_playing_card',
      blockTitle: block.title,
      plannedStart: block.planned_start,
      plannedEnd: block.planned_end,
    },
  })
}

export function autoStartFirstBlockOfDay(): void {
  const db = getDatabase()
  const scheduleDate = todayDateString()
  const started = tryActivateDueBlock(db, scheduleDate)
  if (started) {
    narrateBlockStarted(started)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('schedule:block-changed', {
        scheduleDate,
        blockId: started.id,
        nextBlockId: null,
        reason: 'due_started',
      })
    }
  }
}

export function handleSnoozeBlock(blockId: number, minutes: number): void {
  snoozeBlock(blockId, minutes)
}

export function handlePauseAutoStart(minutes: number): void {
  pauseAutoStart(minutes)
}

function tickCountdowns(): void {
  if (isAutoStartPaused()) {
    return
  }

  const db = getDatabase()
  const scheduleDate = todayDateString()
  const now = Date.now()
  const active = getActiveBlock(db, scheduleDate)
  if (active) {
    return
  }

  const next = findNextPlannedBlock(db, scheduleDate)
  if (!next || getSnoozedBlockIds().has(next.id)) {
    return
  }

  const startMs = new Date(next.planned_start).getTime()
  const secondsUntil = Math.floor((startMs - now) / 1000)
  const countdownKey = `countdown:${next.id}:${scheduleDate}`

  if (secondsUntil > 0 && secondsUntil <= 60) {
    if (!countdownSent.has(countdownKey)) {
      countdownSent.add(countdownKey)
      narrate({
        message: assistantLexicon.blockStartingSoon(next.title, secondsUntil),
        dedupeKey: countdownKey,
        actions: [
          { id: 'ready', label: assistantLexicon.ready },
          { id: 'snooze_5', label: assistantLexicon.snooze5 },
          { id: 'skip', label: assistantLexicon.skipBlock },
          { id: 'not_ready', label: assistantLexicon.notReady },
        ],
        metadata: {
          blockId: next.id,
          attachmentType: 'countdown_card',
          blockTitle: next.title,
          secondsUntil,
        },
      })
    }
  }
}

function tickHourlyNarration(): void {
  const settings = getAllSettings(getDatabase())
  if (!settings.assistant.hourlyEnabled) {
    return
  }
  const now = new Date()
  if (now.getMinutes() !== 0) {
    return
  }
  const hour = now.getHours()
  const scheduleDate = todayDateString()
  const blocks = listBlocksForDate(getDatabase(), scheduleDate)
  const completed = blocks.filter((block) => block.status === 'completed').length
  const next = findNextPlannedBlock(getDatabase(), scheduleDate)

  narrate({
    message: `Hourly check-in: ${completed} block${completed === 1 ? '' : 's'} done. ${
      next ? `Up next: ${next.title}.` : 'Nothing else planned.'
    }`,
    dedupeKey: `hourly_narrator:${scheduleDate}:${hour}`,
    metadata: { briefingType: 'hourly' },
  })
}

function tickNarrator(): void {
  tickCountdowns()
  tickHourlyNarration()
}

export function startDayNarrator(window: BrowserWindow): void {
  mainWindow = window
  if (narratorInterval) {
    return
  }
  narratorInterval = setInterval(tickNarrator, 15_000)
  tickNarrator()
}

export function stopDayNarrator(): void {
  if (narratorInterval) {
    clearInterval(narratorInterval)
    narratorInterval = null
  }
  mainWindow = null
  countdownSent.clear()
}

export function resetDayNarratorForDate(): void {
  countdownSent.clear()
}
