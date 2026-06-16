import type Database from 'better-sqlite3'
import { SYSTEM_UNASSIGNED_CLIENT_NAME } from '@shared/constants/systemClient'
import {
  priorityFromEisenhower,
  type EisenhowerFlags,
} from '@shared/tasks/eisenhower'
import type { TaskRow } from '@shared/types/db'
import type { CreateTaskInput, TaskListFilters, UpdateTaskInput } from '@shared/types/tasks'
import { nowIso } from '@shared/utils/time'

const RECENT_WINDOW_MS = 48 * 60 * 60 * 1000

function toStoredFlag(value: boolean | null | undefined): number | null {
  if (value == null) {
    return null
  }
  return value ? 1 : 0
}

function resolveTaskPriority(
  input: Pick<CreateTaskInput, 'priority' | 'is_urgent' | 'is_important'>
): number {
  if (input.is_urgent != null || input.is_important != null) {
    return priorityFromEisenhower({
      isUrgent: input.is_urgent ?? null,
      isImportant: input.is_important ?? null,
    })
  }
  return input.priority ?? 5
}

function appendQuadrantFilter(filters: TaskListFilters, conditions: string[]): void {
  if (!filters.quadrant) {
    return
  }

  switch (filters.quadrant) {
    case 'do_first':
      conditions.push('t.is_urgent = 1 AND t.is_important = 1')
      break
    case 'schedule':
      conditions.push('t.is_urgent = 0 AND t.is_important = 1')
      break
    case 'delegate':
      conditions.push('t.is_urgent = 1 AND t.is_important = 0')
      break
    case 'eliminate':
      conditions.push('t.is_urgent = 0 AND t.is_important = 0')
      break
    case 'unset':
      conditions.push('(t.is_urgent IS NULL OR t.is_important IS NULL)')
      break
  }
}

export function getUnassignedClientId(db: Database.Database): number {
  const row = db
    .prepare('SELECT id FROM clients_projects WHERE name = ?')
    .get(SYSTEM_UNASSIGNED_CLIENT_NAME) as { id: number } | undefined

  if (!row) {
    throw new Error('System unassigned client not found. Run migrations.')
  }

  return row.id
}

export function listTasks(db: Database.Database, filters: TaskListFilters = {}): TaskRow[] {
  const conditions: string[] = []
  const params: Record<string, unknown> = {}

  if (filters.clientId !== undefined) {
    conditions.push('t.client_id = @clientId')
    params.clientId = filters.clientId
  }

  if (filters.priority !== undefined) {
    conditions.push('t.priority = @priority')
    params.priority = filters.priority
  }

  if (filters.priorityMax !== undefined) {
    conditions.push('t.priority <= @priorityMax')
    params.priorityMax = filters.priorityMax
  }

  if (filters.status !== undefined) {
    conditions.push('t.status = @status')
    params.status = filters.status
  }

  if (filters.recentOnly) {
    conditions.push('t.created_at >= @recentSince')
    params.recentSince = new Date(Date.now() - RECENT_WINDOW_MS).toISOString()
  }

  appendQuadrantFilter(filters, conditions)

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  return db
    .prepare(
      `
      SELECT t.*
      FROM tasks t
      ${whereClause}
      ORDER BY t.priority ASC, t.deadline_date IS NULL, t.deadline_date ASC, t.created_at ASC
    `
    )
    .all(params) as TaskRow[]
}

export function listTasksWithClients(
  db: Database.Database,
  filters: TaskListFilters = {}
): Array<TaskRow & { client_name: string; client_color: string }> {
  const conditions: string[] = []
  const params: Record<string, unknown> = {}

  if (filters.clientId !== undefined) {
    conditions.push('t.client_id = @clientId')
    params.clientId = filters.clientId
  }

  if (filters.priority !== undefined) {
    conditions.push('t.priority = @priority')
    params.priority = filters.priority
  }

  if (filters.priorityMax !== undefined) {
    conditions.push('t.priority <= @priorityMax')
    params.priorityMax = filters.priorityMax
  }

  if (filters.status !== undefined) {
    conditions.push('t.status = @status')
    params.status = filters.status
  }

  if (filters.recentOnly) {
    conditions.push('t.created_at >= @recentSince')
    params.recentSince = new Date(Date.now() - RECENT_WINDOW_MS).toISOString()
  }

  appendQuadrantFilter(filters, conditions)

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  return db
    .prepare(
      `
      SELECT t.*, c.name AS client_name, c.color AS client_color
      FROM tasks t
      JOIN clients_projects c ON c.id = t.client_id
      ${whereClause}
      ORDER BY t.priority ASC, t.deadline_date IS NULL, t.deadline_date ASC, t.created_at ASC
    `
    )
    .all(params) as Array<TaskRow & { client_name: string; client_color: string }>
}

export function getTaskById(db: Database.Database, id: number): TaskRow | null {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined
  return row ?? null
}

export function createTask(db: Database.Database, input: CreateTaskInput): TaskRow {
  const timestamp = nowIso()
  const priority = resolveTaskPriority(input)
  const result = db
    .prepare(
      `
      INSERT INTO tasks (
        client_id, title, description, priority, is_urgent, is_important, deadline_date,
        estimated_minutes, status, created_at, updated_at
      ) VALUES (
        @client_id, @title, @description, @priority, @is_urgent, @is_important, @deadline_date,
        @estimated_minutes, @status, @created_at, @updated_at
      )
    `
    )
    .run({
      client_id: input.client_id,
      title: input.title.trim(),
      description: input.description ?? null,
      priority,
      is_urgent: toStoredFlag(input.is_urgent),
      is_important: toStoredFlag(input.is_important),
      deadline_date: input.deadline_date ?? null,
      estimated_minutes: input.estimated_minutes ?? 30,
      status: input.status ?? 'pending',
      created_at: timestamp,
      updated_at: timestamp,
    })

  const created = getTaskById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to create task')
  }
  return created
}

export function updateTask(db: Database.Database, input: UpdateTaskInput): TaskRow | null {
  const existing = getTaskById(db, input.id)
  if (!existing) {
    return null
  }

  let completedAt = existing.completed_at
  if (input.status === 'completed') {
    completedAt = nowIso()
  } else if (input.status !== undefined) {
    completedAt = null
  }

  const nextFlags: EisenhowerFlags = {
    isUrgent:
      input.is_urgent !== undefined
        ? input.is_urgent
        : existing.is_urgent == null
          ? null
          : existing.is_urgent === 1,
    isImportant:
      input.is_important !== undefined
        ? input.is_important
        : existing.is_important == null
          ? null
          : existing.is_important === 1,
  }

  const nextPriority =
    input.priority ??
    (input.is_urgent !== undefined || input.is_important !== undefined
      ? priorityFromEisenhower(nextFlags)
      : existing.priority)

  db.prepare(
    `
    UPDATE tasks SET
      client_id = @client_id,
      title = @title,
      description = @description,
      priority = @priority,
      is_urgent = @is_urgent,
      is_important = @is_important,
      deadline_date = @deadline_date,
      estimated_minutes = @estimated_minutes,
      status = @status,
      deferred_to_date = @deferred_to_date,
      completed_at = @completed_at,
      updated_at = @updated_at
    WHERE id = @id
  `
  ).run({
    id: input.id,
    client_id: input.client_id ?? existing.client_id,
    title: input.title?.trim() ?? existing.title,
    description: input.description !== undefined ? input.description : existing.description,
    priority: nextPriority,
    is_urgent:
      input.is_urgent !== undefined ? toStoredFlag(input.is_urgent) : existing.is_urgent,
    is_important:
      input.is_important !== undefined ? toStoredFlag(input.is_important) : existing.is_important,
    deadline_date: input.deadline_date !== undefined ? input.deadline_date : existing.deadline_date,
    estimated_minutes:
      input.estimated_minutes !== undefined ? input.estimated_minutes : existing.estimated_minutes,
    status: input.status ?? existing.status,
    deferred_to_date:
      input.deferred_to_date !== undefined ? input.deferred_to_date : existing.deferred_to_date,
    completed_at: completedAt,
    updated_at: nowIso(),
  })

  return getTaskById(db, input.id)
}

export function deleteTask(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  return result.changes > 0
}

export function listTasksForAllocation(db: Database.Database, scheduleDate: string): TaskRow[] {
  return db
    .prepare(
      `
      SELECT *
      FROM tasks
      WHERE status IN ('pending', 'in_progress')
        AND (deferred_to_date IS NULL OR deferred_to_date <= @scheduleDate)
      ORDER BY priority ASC, deadline_date ASC NULLS LAST, created_at ASC
    `
    )
    .all({ scheduleDate }) as TaskRow[]
}

export function bumpTasksToDate(
  db: Database.Database,
  taskIds: number[],
  deferredDate: string
): void {
  if (taskIds.length === 0) {
    return
  }

  const stmt = db.prepare(`
    UPDATE tasks
    SET deferred_to_date = @deferredDate, updated_at = @updated_at
    WHERE id = @id
  `)

  const timestamp = nowIso()
  const bump = db.transaction((ids: number[]) => {
    for (const id of ids) {
      stmt.run({ id, deferredDate, updated_at: timestamp })
    }
  })

  bump(taskIds)
}
