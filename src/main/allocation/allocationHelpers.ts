import type Database from 'better-sqlite3'
import type { ScheduleBlock } from '@shared/allocation/types'
import { parseScheduleDateTime, toIsoLocal } from '@shared/allocation/timeline'
import type { FixedBlockOverride, ScheduleGeneratePayload } from '@shared/types/schedule'
import type { ClientProjectRow } from '@shared/types/db'
import {
  runDayAllocation,
  runReallocationAfterLongBreak,
  type RunAllocationParams,
  type TaskRowForAllocation,
} from '../allocation/runAllocation'

export function applyFixedBlockOverrides(
  clients: ClientProjectRow[],
  overrides: FixedBlockOverride[] = []
): ClientProjectRow[] {
  if (overrides.length === 0) {
    return clients
  }

  const overrideMap = new Map(overrides.map((entry) => [entry.clientId, entry]))

  return clients.map((client) => {
    const override = overrideMap.get(client.id)
    if (!override) {
      return client
    }

    return {
      ...client,
      fixed_block_enabled: 1,
      fixed_block_start: override.start,
      fixed_block_duration_minutes: override.durationMinutes,
    }
  })
}

export function buildWakeIso(scheduleDate: string, wakeTime: string): string {
  if (wakeTime.includes('T')) {
    return wakeTime
  }
  return toIsoLocal(parseScheduleDateTime(scheduleDate, wakeTime))
}

export function buildRunParams(
  payload: ScheduleGeneratePayload
): RunAllocationParams & { capacityMinutes?: number; fixedBlockOverrides?: FixedBlockOverride[] } {
  return {
    scheduleDate: payload.scheduleDate,
    wakeTime: buildWakeIso(payload.scheduleDate, payload.wakeTime),
    sleepTargetTime: payload.sleepTargetTime,
    bufferPercent: payload.bufferPercent,
    capacityMinutes: payload.capacityMinutes,
    fixedBlockOverrides: payload.fixedBlockOverrides,
  }
}

export function runPreviewAllocation(
  db: Database.Database,
  payload: ScheduleGeneratePayload,
  tasks: TaskRowForAllocation[]
): ReturnType<typeof runDayAllocation> {
  const params = buildRunParams(payload)
  const clients = (
    db.prepare('SELECT * FROM clients_projects ORDER BY sort_order ASC, id ASC').all() as ClientProjectRow[]
  )
  const overriddenClients = applyFixedBlockOverrides(clients, params.fixedBlockOverrides)

  return runDayAllocation(db, params, tasks, overriddenClients)
}

export function runPersistedReallocation(
  db: Database.Database,
  params: RunAllocationParams,
  tasks: TaskRowForAllocation[],
  existingBlocks: ScheduleBlock[],
  returnTime: string,
  longBreakDurationMinutes: number,
  overriddenClients?: ClientProjectRow[]
): ReturnType<typeof runReallocationAfterLongBreak> {
  return runReallocationAfterLongBreak(
    db,
    params,
    tasks,
    existingBlocks,
    returnTime,
    longBreakDurationMinutes,
    overriddenClients
  )
}
