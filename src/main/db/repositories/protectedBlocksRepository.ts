import type Database from 'better-sqlite3'
import type {
  CreateProtectedBlockInput,
  ProtectedBlockRow,
  UpdateProtectedBlockInput,
} from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

export function listProtectedBlocks(db: Database.Database): ProtectedBlockRow[] {
  return db
    .prepare(
      `
      SELECT *
      FROM protected_blocks
      ORDER BY sort_order ASC, id ASC
    `
    )
    .all() as ProtectedBlockRow[]
}

export function getProtectedBlockById(
  db: Database.Database,
  id: number
): ProtectedBlockRow | null {
  const row = db.prepare('SELECT * FROM protected_blocks WHERE id = ?').get(id) as
    | ProtectedBlockRow
    | undefined

  return row ?? null
}

export function createProtectedBlock(
  db: Database.Database,
  input: CreateProtectedBlockInput
): ProtectedBlockRow {
  const timestamp = nowIso()
  const result = db
    .prepare(
      `
      INSERT INTO protected_blocks (
        block_type, label, duration_minutes, anchor_type, anchor_value,
        sort_order, is_enabled, created_at, updated_at
      ) VALUES (
        @block_type, @label, @duration_minutes, @anchor_type, @anchor_value,
        @sort_order, @is_enabled, @created_at, @updated_at
      )
    `
    )
    .run({
      block_type: input.block_type,
      label: input.label,
      duration_minutes: input.duration_minutes,
      anchor_type: input.anchor_type,
      anchor_value: input.anchor_value,
      sort_order: input.sort_order ?? 0,
      is_enabled: input.is_enabled === false ? 0 : 1,
      created_at: timestamp,
      updated_at: timestamp,
    })

  const created = getProtectedBlockById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to create protected block')
  }
  return created
}

export function updateProtectedBlock(
  db: Database.Database,
  input: UpdateProtectedBlockInput
): ProtectedBlockRow | null {
  const existing = getProtectedBlockById(db, input.id)
  if (!existing) {
    return null
  }

  const updated = {
    block_type: input.block_type ?? existing.block_type,
    label: input.label ?? existing.label,
    duration_minutes: input.duration_minutes ?? existing.duration_minutes,
    anchor_type: input.anchor_type ?? existing.anchor_type,
    anchor_value: input.anchor_value ?? existing.anchor_value,
    sort_order: input.sort_order ?? existing.sort_order,
    is_enabled:
      input.is_enabled === undefined ? existing.is_enabled : input.is_enabled ? 1 : 0,
    updated_at: nowIso(),
  }

  db.prepare(
    `
    UPDATE protected_blocks
    SET
      block_type = @block_type,
      label = @label,
      duration_minutes = @duration_minutes,
      anchor_type = @anchor_type,
      anchor_value = @anchor_value,
      sort_order = @sort_order,
      is_enabled = @is_enabled,
      updated_at = @updated_at
    WHERE id = @id
  `
  ).run({ ...updated, id: input.id })

  return getProtectedBlockById(db, input.id)
}

export function deleteProtectedBlock(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM protected_blocks WHERE id = ?').run(id)
  return result.changes > 0
}
