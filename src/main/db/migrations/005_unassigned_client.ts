import type Database from 'better-sqlite3'
import { SYSTEM_UNASSIGNED_CLIENT_NAME } from '@shared/constants/systemClient'

export function applyUnassignedClientMigration(db: Database.Database): void {
  const existing = db
    .prepare('SELECT id FROM clients_projects WHERE name = ?')
    .get(SYSTEM_UNASSIGNED_CLIENT_NAME) as { id: number } | undefined

  if (existing) {
    return
  }

  const timestamp = new Date().toISOString()
  db.prepare(
    `
    INSERT INTO clients_projects (
      name, color, weight_percent, is_active, fixed_block_enabled,
      fixed_block_start, fixed_block_duration_minutes, staleness_threshold_hours,
      sort_order, created_at, updated_at
    ) VALUES (
      @name, @color, 0, 1, 0,
      NULL, NULL, NULL,
      -1, @created_at, @updated_at
    )
  `
  ).run({
    name: SYSTEM_UNASSIGNED_CLIENT_NAME,
    color: '#64748B',
    created_at: timestamp,
    updated_at: timestamp,
  })
}
