import type Database from 'better-sqlite3'
import { DEFAULT_OPENROUTER_FREE_MODELS } from '@shared/constants/chatAi'

const OPENROUTER_FREE_MODELS_SETTING = {
  key: 'openrouter_free_models',
  value: JSON.stringify(DEFAULT_OPENROUTER_FREE_MODELS),
} as const

export function applyOpenRouterFreeModelsMigration(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
  `)

  insert.run({
    ...OPENROUTER_FREE_MODELS_SETTING,
    updated_at: new Date().toISOString(),
  })
}
