import { addMinutes, parseScheduleDateTime } from '@shared/allocation/timeline'
import type { DailySettingsNotes, FixedBlockOverride } from '@shared/types/schedule'

export interface FixedBlockWindow {
  scheduleDate: string
  windowStart: Date
  windowEnd: Date
}

export function parseFixedBlockOverrides(notes: string | null | undefined): FixedBlockOverride[] {
  if (!notes) {
    return []
  }

  try {
    const parsed = JSON.parse(notes) as DailySettingsNotes
    return parsed.fixedBlockOverrides ?? []
  } catch {
    return []
  }
}

export function resolveFixedBlockWindow(
  scheduleDate: string,
  startHHMM: string,
  durationMinutes: number
): FixedBlockWindow {
  const windowStart = parseScheduleDateTime(scheduleDate, startHHMM)
  const windowEnd = addMinutes(windowStart, durationMinutes)
  return { scheduleDate, windowStart, windowEnd }
}

export function isWithinWindow(now: Date, window: FixedBlockWindow): boolean {
  const nowMs = now.getTime()
  return nowMs >= window.windowStart.getTime() && nowMs < window.windowEnd.getTime()
}

export function resolveClientFixedBlockWindow(
  scheduleDate: string,
  client: {
    id: number
    fixed_block_enabled: number
    fixed_block_start: string | null
    fixed_block_duration_minutes: number | null
  },
  overrides: FixedBlockOverride[]
): FixedBlockWindow | null {
  if (client.fixed_block_enabled !== 1) {
    return null
  }

  const override = overrides.find((entry) => entry.clientId === client.id)
  const startHHMM = override?.start ?? client.fixed_block_start
  const durationMinutes =
    override?.durationMinutes ?? client.fixed_block_duration_minutes ?? 0

  if (!startHHMM || durationMinutes <= 0) {
    return null
  }

  return resolveFixedBlockWindow(scheduleDate, startHHMM, durationMinutes)
}
