import type Database from 'better-sqlite3'
import type {
  ClientProjectRow,
  CreateClientProjectInput,
  UpdateClientProjectInput,
} from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

function mapClientRow(row: ClientProjectRow): ClientProjectRow {
  return row
}

export function listClients(db: Database.Database): ClientProjectRow[] {
  const rows = db
    .prepare(
      `
      SELECT *
      FROM clients_projects
      ORDER BY sort_order ASC, id ASC
    `
    )
    .all() as ClientProjectRow[]

  return rows.map(mapClientRow)
}

export function getClientById(db: Database.Database, id: number): ClientProjectRow | null {
  const row = db.prepare('SELECT * FROM clients_projects WHERE id = ?').get(id) as
    | ClientProjectRow
    | undefined

  return row ? mapClientRow(row) : null
}

export function createClient(
  db: Database.Database,
  input: CreateClientProjectInput
): ClientProjectRow {
  const timestamp = nowIso()
  const result = db
    .prepare(
      `
      INSERT INTO clients_projects (
        name, color, weight_percent, is_active, fixed_block_enabled,
        fixed_block_start, fixed_block_duration_minutes, staleness_threshold_hours,
        sort_order, created_at, updated_at
      ) VALUES (
        @name, @color, @weight_percent, @is_active, @fixed_block_enabled,
        @fixed_block_start, @fixed_block_duration_minutes, @staleness_threshold_hours,
        @sort_order, @created_at, @updated_at
      )
    `
    )
    .run({
      name: input.name,
      color: input.color,
      weight_percent: input.weight_percent ?? 0,
      is_active: input.is_active === false ? 0 : 1,
      fixed_block_enabled: input.fixed_block_enabled ? 1 : 0,
      fixed_block_start: input.fixed_block_start ?? null,
      fixed_block_duration_minutes: input.fixed_block_duration_minutes ?? null,
      staleness_threshold_hours: input.staleness_threshold_hours ?? null,
      sort_order: input.sort_order ?? 0,
      created_at: timestamp,
      updated_at: timestamp,
    })

  const created = getClientById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to create client')
  }
  return created
}

export function updateClient(
  db: Database.Database,
  input: UpdateClientProjectInput
): ClientProjectRow | null {
  const existing = getClientById(db, input.id)
  if (!existing) {
    return null
  }

  const updated = {
    name: input.name ?? existing.name,
    color: input.color ?? existing.color,
    weight_percent: input.weight_percent ?? existing.weight_percent,
    is_active: input.is_active === undefined ? existing.is_active : input.is_active ? 1 : 0,
    fixed_block_enabled:
      input.fixed_block_enabled === undefined
        ? existing.fixed_block_enabled
        : input.fixed_block_enabled
          ? 1
          : 0,
    fixed_block_start:
      input.fixed_block_start !== undefined ? input.fixed_block_start : existing.fixed_block_start,
    fixed_block_duration_minutes:
      input.fixed_block_duration_minutes !== undefined
        ? input.fixed_block_duration_minutes
        : existing.fixed_block_duration_minutes,
    staleness_threshold_hours:
      input.staleness_threshold_hours !== undefined
        ? input.staleness_threshold_hours
        : existing.staleness_threshold_hours,
    sort_order: input.sort_order ?? existing.sort_order,
    updated_at: nowIso(),
  }

  db.prepare(
    `
    UPDATE clients_projects
    SET
      name = @name,
      color = @color,
      weight_percent = @weight_percent,
      is_active = @is_active,
      fixed_block_enabled = @fixed_block_enabled,
      fixed_block_start = @fixed_block_start,
      fixed_block_duration_minutes = @fixed_block_duration_minutes,
      staleness_threshold_hours = @staleness_threshold_hours,
      sort_order = @sort_order,
      updated_at = @updated_at
    WHERE id = @id
  `
  ).run({ ...updated, id: input.id })

  return getClientById(db, input.id)
}

export function deleteClient(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM clients_projects WHERE id = ?').run(id)
  return result.changes > 0
}
