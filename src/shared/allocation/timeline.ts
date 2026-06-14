import { DEFAULT_SLEEP_TIME } from './constants'

export interface TimeInterval {
  start: Date
  end: Date
}

let tempIdCounter = 0

export function resetTempIdCounter(): void {
  tempIdCounter = 0
}

export function createTempId(prefix: string): string {
  tempIdCounter += 1
  return `${prefix}-${tempIdCounter}`
}

export function parseIsoLocal(iso: string): Date {
  return new Date(iso)
}

export function toIsoLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

export function parseScheduleDateTime(scheduleDate: string, timeHHMM: string): Date {
  const [hours, minutes] = timeHHMM.split(':').map(Number)
  const [year, month, day] = scheduleDate.split('-').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000))
}

export function overlaps(a: TimeInterval, b: TimeInterval): boolean {
  return a.start < b.end && b.start < a.end
}

export function getDayWindow(
  scheduleDate: string,
  wakeTime: string,
  sleepTargetTime?: string
): TimeInterval | null {
  const wake = parseIsoLocal(wakeTime)
  const sleepTime = sleepTargetTime ?? DEFAULT_SLEEP_TIME
  const sleep = parseScheduleDateTime(scheduleDate, sleepTime)

  if (wake >= sleep) {
    return null
  }

  return { start: wake, end: sleep }
}

export function intervalFromStartDuration(start: Date, durationMinutes: number): TimeInterval {
  return { start, end: addMinutes(start, durationMinutes) }
}

export function totalMinutes(intervals: TimeInterval[]): number {
  return intervals.reduce((sum, interval) => sum + minutesBetween(interval.start, interval.end), 0)
}

export function subtractInterval(
  freeIntervals: TimeInterval[],
  occupied: TimeInterval
): TimeInterval[] {
  const result: TimeInterval[] = []

  for (const interval of freeIntervals) {
    if (!overlaps(interval, occupied)) {
      result.push(interval)
      continue
    }

    if (occupied.start > interval.start) {
      result.push({ start: interval.start, end: occupied.start })
    }
    if (occupied.end < interval.end) {
      result.push({ start: occupied.end, end: interval.end })
    }
  }

  return mergeAdjacentIntervals(result)
}

export function subtractIntervals(
  freeIntervals: TimeInterval[],
  occupiedList: TimeInterval[]
): TimeInterval[] {
  return occupiedList.reduce((current, occupied) => subtractInterval(current, occupied), freeIntervals)
}

export function mergeAdjacentIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) {
    return []
  }

  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime())
  const merged: TimeInterval[] = [sorted[0]]

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index]
    const last = merged[merged.length - 1]

    if (current.start.getTime() <= last.end.getTime()) {
      last.end = current.end > last.end ? current.end : last.end
    } else {
      merged.push(current)
    }
  }

  return merged
}

export function findLatestOverlapEnd(
  candidate: TimeInterval,
  existing: TimeInterval[]
): Date | null {
  let latest: Date | null = null

  for (const block of existing) {
    if (overlaps(candidate, block) && (!latest || block.end > latest)) {
      latest = block.end
    }
  }

  return latest
}

export function firstFitSegment(
  freeIntervals: TimeInterval[],
  durationMinutes: number
): { interval: TimeInterval; segment: TimeInterval } | null {
  for (const interval of freeIntervals) {
    const available = minutesBetween(interval.start, interval.end)
    if (available >= durationMinutes) {
      const segment: TimeInterval = {
        start: interval.start,
        end: addMinutes(interval.start, durationMinutes),
      }
      return { interval, segment }
    }
  }
  return null
}

export function blocksToIntervals(blocks: Array<{ plannedStart: string; plannedEnd: string }>): TimeInterval[] {
  return blocks.map((block) => ({
    start: parseIsoLocal(block.plannedStart),
    end: parseIsoLocal(block.plannedEnd),
  }))
}

export function resolveProtectedStart(
  template: {
    anchorType: 'wake_offset' | 'fixed_time' | 'relative'
    anchorValue: string
  },
  scheduleDate: string,
  wakeTime: string,
  winddownStart?: Date
): Date | null {
  const wake = parseIsoLocal(wakeTime)

  if (template.anchorType === 'wake_offset') {
    const offsetMinutes = Number(template.anchorValue)
    if (Number.isNaN(offsetMinutes)) {
      return null
    }
    return addMinutes(wake, offsetMinutes)
  }

  if (template.anchorType === 'fixed_time') {
    return parseScheduleDateTime(scheduleDate, template.anchorValue)
  }

  if (template.anchorType === 'relative' && winddownStart) {
    const offsetMinutes = Number(template.anchorValue)
    if (Number.isNaN(offsetMinutes)) {
      return null
    }
    return addMinutes(winddownStart, -offsetMinutes)
  }

  return null
}
