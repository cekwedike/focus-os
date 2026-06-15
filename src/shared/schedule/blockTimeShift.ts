import {
  formatScheduleInstant,
  normalizeScheduleInstant,
  parseScheduleInstant,
  shiftScheduleInstant,
} from '@shared/utils/scheduleTimestamp'

export function shiftIsoByMinutes(iso: string, deltaMinutes: number): string {
  return shiftScheduleInstant(iso, deltaMinutes)
}

export function computeDurationMinutes(plannedStart: string, plannedEnd: string): number {
  const startMs = parseScheduleInstant(plannedStart).getTime()
  const endMs = parseScheduleInstant(plannedEnd).getTime()
  return Math.max(1, Math.round((endMs - startMs) / 60_000))
}

export function computeShiftedBlockTimes(
  plannedStart: string,
  plannedEnd: string,
  deltaMinutes: number
): {
  plannedStart: string
  plannedEnd: string
  plannedDurationMinutes: number
} {
  const nextStart = shiftScheduleInstant(plannedStart, deltaMinutes)
  const nextEnd = shiftScheduleInstant(plannedEnd, deltaMinutes)

  return {
    plannedStart: nextStart,
    plannedEnd: nextEnd,
    plannedDurationMinutes: computeDurationMinutes(nextStart, nextEnd),
  }
}

export function computeReclaimMinutes(plannedEnd: string, nowMs: number): number {
  const endMs = parseScheduleInstant(plannedEnd).getTime()
  if (Number.isNaN(endMs) || endMs <= nowMs) {
    return 0
  }

  return Math.max(0, Math.round((endMs - nowMs) / 60_000))
}

export function normalizePlannedTimes(
  plannedStart: string,
  plannedEnd: string
): { plannedStart: string; plannedEnd: string } {
  return {
    plannedStart: normalizeScheduleInstant(plannedStart),
    plannedEnd: normalizeScheduleInstant(plannedEnd),
  }
}

export { formatScheduleInstant }
