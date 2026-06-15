import type Database from 'better-sqlite3'
import { nowIso } from '@shared/utils/time'
import type { ProtectedBlockType } from '@shared/types/db'

interface ProtectedBlockSeed {
  block_type: ProtectedBlockType
  label: string
  duration_minutes: number
  anchor_type: 'wake_offset' | 'fixed_time' | 'relative'
  anchor_value: string
  sort_order: number
  is_enabled: number
  skippable: number
}

function skippableForType(blockType: ProtectedBlockType): number {
  return blockType === 'meal' || blockType === 'micro_break' ? 1 : 0
}

/**
 * Default protected block templates.
 * Durations are reasonable freelancer defaults (not specified in ALLOCATION_ENGINE.md):
 * - morning_routine: 30 min, 15 minutes after wake
 * - faith: 25 min, 45 minutes after wake
 * - meal: 25 min lunch at 12:30 (additional meals can be added in Settings)
 * - micro_break: 10 min scheduled slot, disabled by default (popups handle most breaks)
 * - winddown: 30 min at 22:00 before default 23:00 sleep target
 */
export const PROTECTED_BLOCK_SEEDS: ProtectedBlockSeed[] = [
  {
    block_type: 'morning_routine',
    label: 'Morning routine',
    duration_minutes: 30,
    anchor_type: 'wake_offset',
    anchor_value: '15',
    sort_order: 0,
    is_enabled: 1,
    skippable: skippableForType('morning_routine'),
  },
  {
    block_type: 'faith',
    label: 'Faith and prayer',
    duration_minutes: 25,
    anchor_type: 'wake_offset',
    anchor_value: '45',
    sort_order: 1,
    is_enabled: 1,
    skippable: skippableForType('faith'),
  },
  {
    block_type: 'meal',
    label: 'Lunch',
    duration_minutes: 25,
    anchor_type: 'fixed_time',
    anchor_value: '12:30',
    sort_order: 2,
    is_enabled: 1,
    skippable: skippableForType('meal'),
  },
  {
    block_type: 'micro_break',
    label: 'Scheduled micro-break',
    duration_minutes: 10,
    anchor_type: 'wake_offset',
    anchor_value: '90',
    sort_order: 3,
    is_enabled: 0,
    skippable: skippableForType('micro_break'),
  },
  {
    block_type: 'winddown',
    label: 'Wind-down',
    duration_minutes: 30,
    anchor_type: 'fixed_time',
    anchor_value: '22:00',
    sort_order: 4,
    is_enabled: 1,
    skippable: skippableForType('winddown'),
  },
]

const APP_SETTINGS_SEEDS: Array<{ key: string; value: string }> = [
  { key: 'openrouter_model', value: JSON.stringify('') },
  { key: 'ollama_endpoint', value: JSON.stringify('http://localhost:11434') },
  { key: 'ollama_model', value: JSON.stringify('') },
  { key: 'default_staleness_hours', value: JSON.stringify(24) },
  { key: 'micro_break_interval_minutes', value: JSON.stringify(90) },
  { key: 'min_viable_block_minutes', value: JSON.stringify(15) },
  { key: 'default_buffer_percent', value: JSON.stringify(10) },
  { key: 'doomscroll_allowance_minutes', value: JSON.stringify(5) },
  { key: 'time_format', value: JSON.stringify('12h') },
  { key: 'week_starts_on', value: JSON.stringify('sunday') },
  { key: 'date_format', value: JSON.stringify('mdy') },
  { key: 'default_sleep_time', value: JSON.stringify('23:00') },
  { key: 'timezone', value: JSON.stringify('UTC') },
  {
    key: 'notifications',
    value: JSON.stringify({
      microBreak: true,
      staleness: true,
      insightReady: false,
    }),
  },
  { key: 'theme_accent', value: JSON.stringify('#2DD4A0') },
  { key: 'onboarding_complete', value: JSON.stringify(false) },
]

export function seedInitialData(db: Database.Database): void {
  const protectedCount = db.prepare('SELECT COUNT(*) AS count FROM protected_blocks').get() as {
    count: number
  }

  if (protectedCount.count === 0) {
    const insertProtected = db.prepare(`
      INSERT INTO protected_blocks (
        block_type, label, duration_minutes, anchor_type, anchor_value,
        sort_order, is_enabled, skippable, created_at, updated_at
      ) VALUES (
        @block_type, @label, @duration_minutes, @anchor_type, @anchor_value,
        @sort_order, @is_enabled, @skippable, @created_at, @updated_at
      )
    `)

    const timestamp = nowIso()
    const insertMany = db.transaction((rows: ProtectedBlockSeed[]) => {
      for (const row of rows) {
        insertProtected.run({ ...row, created_at: timestamp, updated_at: timestamp })
      }
    })

    insertMany(PROTECTED_BLOCK_SEEDS)
  }

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
  `)

  const settingsTimestamp = nowIso()
  const seedSettings = db.transaction((rows: Array<{ key: string; value: string }>) => {
    for (const row of rows) {
      insertSetting.run({ ...row, updated_at: settingsTimestamp })
    }
  })

  seedSettings(APP_SETTINGS_SEEDS)
}

export const EXPECTED_PROTECTED_BLOCK_TYPES: ProtectedBlockType[] = [
  'morning_routine',
  'faith',
  'meal',
  'micro_break',
  'winddown',
]

export const EXPECTED_TABLE_NAMES = [
  'check_ins_log',
  'clients_projects',
  'tasks',
  'protected_blocks',
  'daily_schedule',
  'breaks_log',
  'faith_log',
  'daily_settings',
  'insights_log',
  'app_settings',
  'schema_migrations',
] as const
