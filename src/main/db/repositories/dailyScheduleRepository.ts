import type Database from 'better-sqlite3'
import type { ScheduleBlock } from '@shared/allocation/types'
import type { DailyScheduleRow, ScheduleBlockStatus } from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

export function listBlocksForDate(
  db: Database.Database,
  scheduleDate: string,
  includeSuperseded = false
): DailyScheduleRow[] {
  const statusFilter = includeSuperseded ? '' : "AND status != 'superseded'"

  return db
    .prepare(
      `
      SELECT *
      FROM daily_schedule
      WHERE schedule_date = @scheduleDate
        ${statusFilter}
      ORDER BY priority_order ASC, planned_start ASC
    `
    )
    .all({ scheduleDate }) as DailyScheduleRow[]
}

export function getBlockById(db: Database.Database, id: number): DailyScheduleRow | null {
  const row = db.prepare('SELECT * FROM daily_schedule WHERE id = ?').get(id) as
    | DailyScheduleRow
    | undefined
  return row ?? null
}

export function getActiveBlock(db: Database.Database, scheduleDate: string): DailyScheduleRow | null {
  const row = db
    .prepare(
      `
      SELECT *
      FROM daily_schedule
      WHERE schedule_date = @scheduleDate AND status = 'active'
      LIMIT 1
    `
    )
    .get({ scheduleDate }) as DailyScheduleRow | undefined
  return row ?? null
}

export function mapEngineBlockToRow(
  block: ScheduleBlock,
  scheduleDate: string,
  priorityOrder: number
): Omit<DailyScheduleRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    schedule_date: scheduleDate,
    block_type: block.blockType,
    protected_subtype: block.protectedSubtype ?? null,
    client_id: block.clientId ?? null,
    task_id: block.taskId ?? null,
    title: block.title,
    planned_start: block.plannedStart,
    planned_end: block.plannedEnd,
    planned_duration_minutes: block.plannedDurationMinutes,
    actual_start: null,
    actual_end: null,
    actual_duration_minutes: null,
    status: (block.status as ScheduleBlockStatus) ?? 'planned',
    priority_order: block.priorityOrder ?? priorityOrder,
    metadata_json: block.metadataJson ? JSON.stringify(block.metadataJson) : null,
  }
}

export function mapRowToEngineBlock(row: DailyScheduleRow): ScheduleBlock {
  return {
    tempId: `db-${row.id}`,
    scheduleDate: row.schedule_date,
    blockType: row.block_type,
    protectedSubtype: row.protected_subtype ?? undefined,
    clientId: row.client_id ?? undefined,
    taskId: row.task_id ?? undefined,
    title: row.title,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    plannedDurationMinutes: row.planned_duration_minutes,
    priorityOrder: row.priority_order,
    metadataJson: row.metadata_json ? (JSON.parse(row.metadata_json) as Record<string, unknown>) : undefined,
    status: row.status,
  }
}

export function markBlocksSuperseded(db: Database.Database, scheduleDate: string): void {
  db.prepare(
    `
    UPDATE daily_schedule
    SET status = 'superseded', updated_at = @updated_at
    WHERE schedule_date = @scheduleDate AND status NOT IN ('superseded', 'completed')
  `
  ).run({ scheduleDate, updated_at: nowIso() })
}

export function insertBlocks(
  db: Database.Database,
  scheduleDate: string,
  blocks: ScheduleBlock[]
): DailyScheduleRow[] {
  const insert = db.prepare(
    `
    INSERT INTO daily_schedule (
      schedule_date, block_type, protected_subtype, client_id, task_id, title,
      planned_start, planned_end, planned_duration_minutes,
      actual_start, actual_end, actual_duration_minutes,
      status, priority_order, metadata_json, created_at, updated_at
    ) VALUES (
      @schedule_date, @block_type, @protected_subtype, @client_id, @task_id, @title,
      @planned_start, @planned_end, @planned_duration_minutes,
      @actual_start, @actual_end, @actual_duration_minutes,
      @status, @priority_order, @metadata_json, @created_at, @updated_at
    )
  `
  )

  const timestamp = nowIso()
  const insertedIds: number[] = []

  const insertAll = db.transaction((engineBlocks: ScheduleBlock[]) => {
    engineBlocks.forEach((block, index) => {
      const mapped = mapEngineBlockToRow(block, scheduleDate, block.priorityOrder ?? index)
      const result = insert.run({
        ...mapped,
        created_at: timestamp,
        updated_at: timestamp,
      })
      insertedIds.push(Number(result.lastInsertRowid))
    })
  })

  insertAll(blocks)

  return insertedIds
    .map((id) => getBlockById(db, id))
    .filter((row): row is DailyScheduleRow => row !== null)
}

export function updateBlock(
  db: Database.Database,
  id: number,
  patch: Partial<
    Pick<
      DailyScheduleRow,
      | 'planned_start'
      | 'planned_end'
      | 'planned_duration_minutes'
      | 'actual_start'
      | 'actual_end'
      | 'actual_duration_minutes'
      | 'status'
      | 'metadata_json'
    >
  >
): DailyScheduleRow | null {
  const existing = getBlockById(db, id)
  if (!existing) {
    return null
  }

  db.prepare(
    `
    UPDATE daily_schedule SET
      planned_start = @planned_start,
      planned_end = @planned_end,
      planned_duration_minutes = @planned_duration_minutes,
      actual_start = @actual_start,
      actual_end = @actual_end,
      actual_duration_minutes = @actual_duration_minutes,
      status = @status,
      metadata_json = @metadata_json,
      updated_at = @updated_at
    WHERE id = @id
  `
  ).run({
    id,
    planned_start: patch.planned_start ?? existing.planned_start,
    planned_end: patch.planned_end ?? existing.planned_end,
    planned_duration_minutes:
      patch.planned_duration_minutes ?? existing.planned_duration_minutes,
    actual_start: patch.actual_start !== undefined ? patch.actual_start : existing.actual_start,
    actual_end: patch.actual_end !== undefined ? patch.actual_end : existing.actual_end,
    actual_duration_minutes:
      patch.actual_duration_minutes !== undefined
        ? patch.actual_duration_minutes
        : existing.actual_duration_minutes,
    status: patch.status ?? existing.status,
    metadata_json: patch.metadata_json !== undefined ? patch.metadata_json : existing.metadata_json,
    updated_at: nowIso(),
  })

  return getBlockById(db, id)
}

export function deactivateOtherActiveBlocks(
  db: Database.Database,
  scheduleDate: string,
  exceptId: number
): void {
  db.prepare(
    `
    UPDATE daily_schedule
    SET status = 'planned', updated_at = @updated_at
    WHERE schedule_date = @scheduleDate AND status = 'active' AND id != @exceptId
  `
  ).run({ scheduleDate, exceptId, updated_at: nowIso() })
}

export function hasCommittedBlocksForDate(db: Database.Database, scheduleDate: string): boolean {
  const row = db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM daily_schedule
      WHERE schedule_date = @scheduleDate AND status != 'superseded'
    `
    )
    .get({ scheduleDate }) as { count: number }
  return row.count > 0
}
