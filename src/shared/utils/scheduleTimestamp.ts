/**
 * Canonical storage format for daily_schedule planned_start / planned_end:
 * local wall-clock ISO 8601 without timezone suffix, e.g. 2026-06-15T20:54:00
 *
 * All schedule instants represent the user's local calendar/time. Parsing uses
 * the JavaScript Date local-time rules for strings without a Z or offset.
 */

const LOCAL_SCHEDULE_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/

export function formatScheduleInstant(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

export function parseScheduleInstant(iso: string): Date {
  return new Date(iso)
}

export function isLocalScheduleInstant(iso: string): boolean {
  return LOCAL_SCHEDULE_INSTANT_PATTERN.test(iso.trim())
}

export function normalizeScheduleInstant(iso: string): string {
  const trimmed = iso.trim()
  if (!trimmed) {
    return trimmed
  }

  const date = parseScheduleInstant(trimmed)
  if (Number.isNaN(date.getTime())) {
    return trimmed
  }

  return formatScheduleInstant(date)
}

export function shiftScheduleInstant(iso: string, deltaMinutes: number): string {
  const shifted = new Date(parseScheduleInstant(iso).getTime() + deltaMinutes * 60_000)
  return formatScheduleInstant(shifted)
}

export function extractLocalTimeHHMM(iso: string): string {
  const date = parseScheduleInstant(iso)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function buildLocalScheduleInstant(scheduleDate: string, timeHHMM: string): string {
  const [hours, minutes] = timeHHMM.split(':').map(Number)
  const [year, month, day] = scheduleDate.split('-').map(Number)
  return formatScheduleInstant(new Date(year, month - 1, day, hours, minutes, 0, 0))
}
