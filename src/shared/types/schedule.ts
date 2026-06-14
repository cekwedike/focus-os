import type { AllocationOutput, ReallocationOutput } from '@shared/allocation/types'
import type { DailyScheduleRow, DailySettingsRow } from './db'

export interface FixedBlockOverride {
  clientId: number
  start: string
  durationMinutes: number
}

export interface DailySettingsNotes {
  fixedBlockOverrides?: FixedBlockOverride[]
}

export interface DailyUpsertInput {
  settings_date: string
  wake_time?: string | null
  sleep_target_time?: string | null
  buffer_percent?: number
  remaining_minutes_at_wake?: number | null
  notes?: string | null
}

export interface ScheduleGeneratePayload {
  scheduleDate: string
  wakeTime: string
  sleepTargetTime?: string
  bufferPercent?: number
  capacityMinutes?: number
  fixedBlockOverrides?: FixedBlockOverride[]
}

export interface ScheduleCommitPayload {
  scheduleDate: string
  settings: DailyUpsertInput
  blocks: AllocationOutput['blocks']
  confirmOverwrite?: boolean
}

export interface ScheduleGetDayPayload {
  date: string
}

export interface ScheduleBlockActionPayload {
  blockId: number
}

export interface ScheduleUpdateBlockPayload {
  blockId: number
  planned_start?: string
  planned_end?: string
  planned_duration_minutes?: number
}

export interface ScheduleReallocatePayload {
  scheduleDate: string
  returnTime: string
  longBreakDurationMinutes: number
}

export interface DayBundle {
  date: string
  settings: DailySettingsRow | null
  blocks: DailyScheduleRow[]
  focusScore: number | null
}

export type ScheduleGenerateResponse = AllocationOutput
export type ScheduleCommitResponse = DayBundle
export type ScheduleGetDayResponse = DayBundle
export type ScheduleReallocateResponse = ReallocationOutput & { dayBundle: DayBundle }
