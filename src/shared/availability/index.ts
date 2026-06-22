import type { CalendarEventRow } from '@shared/types/integrations'
import type { DailyScheduleRow } from '@shared/types/db'
import { parseScheduleInstant } from '@shared/utils/scheduleTimestamp'

export interface BusyInterval {
  start: Date
  end: Date
  label: string
  source: 'schedule' | 'calendar'
}

export interface FindSlotsInput {
  scheduleDate: string
  durationMinutes: number
  dayStartIso: string
  dayEndIso: string
  scheduleBlocks: DailyScheduleRow[]
  calendarEvents: CalendarEventRow[]
  preferredStartHour?: number
  preferredEndHour?: number
  maxSlots?: number
}

export interface RankedSlot {
  startAt: string
  endAt: string
  score: number
  reason: string
}

function toDate(iso: string): Date {
  return parseScheduleInstant(iso)
}

function toLocalIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

function collectBusyIntervals(input: FindSlotsInput): BusyInterval[] {
  const busy: BusyInterval[] = []

  for (const block of input.scheduleBlocks) {
    if (!block.planned_start || !block.planned_end) {
      continue
    }
    if (block.status === 'skipped' || block.status === 'superseded') {
      continue
    }
    busy.push({
      start: toDate(block.planned_start),
      end: toDate(block.planned_end),
      label: block.title,
      source: 'schedule',
    })
  }

  for (const event of input.calendarEvents) {
    if (event.is_all_day === 1) {
      continue
    }
    busy.push({
      start: toDate(event.start_at),
      end: toDate(event.end_at),
      label: event.title,
      source: 'calendar',
    })
  }

  return busy.sort((left, right) => left.start.getTime() - right.start.getTime())
}

function overlaps(start: Date, end: Date, busy: BusyInterval): boolean {
  return start < busy.end && busy.start < end
}

function scoreSlot(start: Date, input: FindSlotsInput): { score: number; reason: string } {
  const hour = start.getHours()
  let score = 50
  let reason = 'Open slot'

  if (input.preferredStartHour !== undefined && input.preferredEndHour !== undefined) {
    if (hour >= input.preferredStartHour && hour < input.preferredEndHour) {
      score += 30
      reason = 'Within your preferred window'
    } else {
      score -= 10
      reason = 'Outside preferred hours but conflict-free'
    }
  }

  if (hour >= 9 && hour <= 17) {
    score += 10
  }

  if (hour < 8 || hour >= 20) {
    score -= 15
    reason = 'Early/late slot'
  }

  return { score, reason }
}

export function findMeetingSlots(input: FindSlotsInput): RankedSlot[] {
  const dayStart = toDate(input.dayStartIso)
  const dayEnd = toDate(input.dayEndIso)
  const durationMs = input.durationMinutes * 60_000
  const busy = collectBusyIntervals(input)
  const now = new Date()
  const slots: RankedSlot[] = []

  let cursor = new Date(Math.max(dayStart.getTime(), now.getTime()))
  cursor.setMinutes(Math.ceil(cursor.getMinutes() / 15) * 15, 0, 0)

  while (cursor.getTime() + durationMs <= dayEnd.getTime()) {
    const slotEnd = new Date(cursor.getTime() + durationMs)
    const conflict = busy.find((interval) => overlaps(cursor, slotEnd, interval))

    if (!conflict) {
      const { score, reason } = scoreSlot(cursor, input)
      slots.push({
        startAt: toLocalIso(cursor),
        endAt: toLocalIso(slotEnd),
        score,
        reason,
      })
    } else {
      cursor = new Date(conflict.end)
      cursor.setMinutes(Math.ceil(cursor.getMinutes() / 15) * 15, 0, 0)
      continue
    }

    cursor = new Date(cursor.getTime() + 15 * 60_000)
  }

  return slots
    .sort((left, right) => right.score - left.score || left.startAt.localeCompare(right.startAt))
    .slice(0, input.maxSlots ?? 5)
}

export function detectScheduleConflicts(
  scheduleBlocks: DailyScheduleRow[],
  calendarEvents: CalendarEventRow[]
): Array<{
  blockTitle: string
  eventTitle: string
  overlapStart: string
  overlapEnd: string
}> {
  const conflicts: Array<{
    blockTitle: string
    eventTitle: string
    overlapStart: string
    overlapEnd: string
  }> = []

  for (const block of scheduleBlocks) {
    if (!block.planned_start || !block.planned_end) {
      continue
    }
    if (block.status === 'skipped' || block.status === 'superseded') {
      continue
    }

    const blockStart = toDate(block.planned_start)
    const blockEnd = toDate(block.planned_end)

    for (const event of calendarEvents) {
      if (event.is_all_day === 1) {
        continue
      }
      const eventStart = toDate(event.start_at)
      const eventEnd = toDate(event.end_at)

      if (blockStart < eventEnd && eventStart < blockEnd) {
        const overlapStart = new Date(Math.max(blockStart.getTime(), eventStart.getTime()))
        const overlapEnd = new Date(Math.min(blockEnd.getTime(), eventEnd.getTime()))
        conflicts.push({
          blockTitle: block.title,
          eventTitle: event.title,
          overlapStart: toLocalIso(overlapStart),
          overlapEnd: toLocalIso(overlapEnd),
        })
      }
    }
  }

  return conflicts
}
