import type Database from 'better-sqlite3'
import type { ProtectedBlockType } from '@shared/types/db'

function defaultSkippableForBlockType(blockType: ProtectedBlockType): number {
  return blockType === 'meal' || blockType === 'micro_break' ? 1 : 0
}

export function applyProtectedBlocksSkippableMigration(db: Database.Database): void {
  const columns = db.prepare('PRAGMA table_info(protected_blocks)').all() as Array<{ name: string }>
  const hasSkippable = columns.some((column) => column.name === 'skippable')

  if (!hasSkippable) {
    db.exec('ALTER TABLE protected_blocks ADD COLUMN skippable INTEGER NOT NULL DEFAULT 0')
  }

  const rows = db
    .prepare('SELECT id, block_type FROM protected_blocks')
    .all() as Array<{ id: number; block_type: ProtectedBlockType }>

  const update = db.prepare('UPDATE protected_blocks SET skippable = @skippable WHERE id = @id')

  for (const row of rows) {
    update.run({
      id: row.id,
      skippable: defaultSkippableForBlockType(row.block_type),
    })
  }
}
