import type Database from 'better-sqlite3'
import { allocateDay, reallocateAfterLongBreak } from '@shared/allocation'
import type {
  AllocationInput,
  AllocationOutput,
  CalendarBlockInput,
  ClientInput,
  ProtectedBlockTemplate,
  ReallocationOutput,
  ScheduleBlock,
  TaskInput,
} from '@shared/allocation/types'
import type { ClientProjectRow, ProtectedBlockRow } from '@shared/types/db'
import type { FixedBlockOverride } from '@shared/types/schedule'
import { applyFixedBlockOverrides } from './allocationHelpers'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import { DEFAULT_MAX_BUFFER_MINUTES } from '@shared/allocation/constants'
import { listCalendarEventsForDate } from '../db/repositories/calendarEventsRepository'

export interface TaskRowForAllocation {
  id: number
  client_id: number
  title: string
  priority: number
  deadline_date: string | null
  estimated_minutes: number | null
  status: string
  deferred_to_date: string | null
  created_at: string
}

export interface RunAllocationParams {
  scheduleDate: string
  wakeTime: string
  sleepTargetTime?: string
  bufferPercent?: number
  capacityMinutes?: number
  fixedBlockOverrides?: FixedBlockOverride[]
}

function mapClient(row: ClientProjectRow): ClientInput {
  return {
    id: row.id,
    name: row.name,
    weightPercent: row.weight_percent,
    isActive: row.is_active === 1,
    fixedBlockEnabled: row.fixed_block_enabled === 1,
    fixedBlockStart: row.fixed_block_start,
    fixedBlockDurationMinutes: row.fixed_block_duration_minutes,
    sortOrder: row.sort_order,
  }
}

function mapProtectedBlock(row: ProtectedBlockRow): ProtectedBlockTemplate {
  return {
    id: row.id,
    blockType: row.block_type,
    label: row.label,
    durationMinutes: row.duration_minutes,
    anchorType: row.anchor_type,
    anchorValue: row.anchor_value,
    sortOrder: row.sort_order,
    isEnabled: row.is_enabled === 1,
  }
}

function mapTask(row: TaskRowForAllocation): TaskInput {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    priority: row.priority,
    deadlineDate: row.deadline_date,
    estimatedMinutes: row.estimated_minutes,
    status: row.status,
    deferredToDate: row.deferred_to_date,
    createdAt: row.created_at,
  }
}

function mapCalendarBlocks(db: Database.Database, scheduleDate: string): CalendarBlockInput[] {
  return listCalendarEventsForDate(db, scheduleDate).map((event) => ({
    externalId: event.external_id,
    title: event.title,
    startTime: event.start_at,
    endTime: event.end_at,
    location: event.location,
  }))
}

export function buildAllocationInput(
  db: Database.Database,
  params: RunAllocationParams,
  tasks: TaskRowForAllocation[],
  clientRows?: ClientProjectRow[]
): AllocationInput {
  const settings = getAllSettings(db)
  const rawClients =
    clientRows ??
    (db
      .prepare('SELECT * FROM clients_projects ORDER BY sort_order ASC, id ASC')
      .all() as ClientProjectRow[])

  const clients = applyFixedBlockOverrides(rawClients, params.fixedBlockOverrides).map(mapClient)

  const protectedBlocks = (
    db
      .prepare('SELECT * FROM protected_blocks ORDER BY sort_order ASC, id ASC')
      .all() as ProtectedBlockRow[]
  ).map(mapProtectedBlock)

  return {
    scheduleDate: params.scheduleDate,
    wakeTime: params.wakeTime,
    sleepTargetTime: params.sleepTargetTime ?? settings.defaultSleepTime,
    bufferPercent: params.bufferPercent ?? settings.defaultBufferPercent,
    protectedBlocks,
    clients,
    tasks: tasks.map(mapTask),
    minViableBlockMinutes: settings.minViableBlockMinutes,
    maxBufferMinutes: settings.maxBufferMinutes ?? DEFAULT_MAX_BUFFER_MINUTES,
    capacityMinutes: params.capacityMinutes,
    calendarBlocks: mapCalendarBlocks(db, params.scheduleDate),
  }
}

export function runDayAllocation(
  db: Database.Database,
  params: RunAllocationParams,
  tasks: TaskRowForAllocation[],
  clientRows?: ClientProjectRow[]
): AllocationOutput {
  const input = buildAllocationInput(db, params, tasks, clientRows)
  return allocateDay(input)
}

export function runReallocationAfterLongBreak(
  db: Database.Database,
  params: RunAllocationParams,
  tasks: TaskRowForAllocation[],
  existingBlocks: ScheduleBlock[],
  returnTime: string,
  longBreakDurationMinutes: number,
  clientRows?: ClientProjectRow[]
): ReallocationOutput {
  const input = buildAllocationInput(db, params, tasks, clientRows)
  return reallocateAfterLongBreak(input, existingBlocks, returnTime, longBreakDurationMinutes)
}
