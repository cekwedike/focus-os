import type Database from 'better-sqlite3'
import { allocateDay, reallocateAfterLongBreak } from '@shared/allocation'
import type {
  AllocationInput,
  AllocationOutput,
  ClientInput,
  ProtectedBlockTemplate,
  ReallocationOutput,
  ScheduleBlock,
  TaskInput,
} from '@shared/allocation/types'
import type { ClientProjectRow, ProtectedBlockRow } from '@shared/types/db'
import { getAllSettings } from '../db/repositories/appSettingsRepository'

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

export function buildAllocationInput(
  db: Database.Database,
  params: RunAllocationParams,
  tasks: TaskRowForAllocation[]
): AllocationInput {
  const settings = getAllSettings(db)
  const clients = (
    db.prepare('SELECT * FROM clients_projects ORDER BY sort_order ASC, id ASC').all() as ClientProjectRow[]
  ).map(mapClient)

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
  }
}

export function runDayAllocation(
  db: Database.Database,
  params: RunAllocationParams,
  tasks: TaskRowForAllocation[]
): AllocationOutput {
  const input = buildAllocationInput(db, params, tasks)
  return allocateDay(input)
}

export function runReallocationAfterLongBreak(
  db: Database.Database,
  params: RunAllocationParams,
  tasks: TaskRowForAllocation[],
  existingBlocks: ScheduleBlock[],
  returnTime: string,
  longBreakDurationMinutes: number
): ReallocationOutput {
  const input = buildAllocationInput(db, params, tasks)
  return reallocateAfterLongBreak(input, existingBlocks, returnTime, longBreakDurationMinutes)
}
