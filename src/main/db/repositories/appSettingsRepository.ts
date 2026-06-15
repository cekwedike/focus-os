import type Database from 'better-sqlite3'
import type { AppSettings, AppSettingsUpdate } from '@shared/types/settings'
import { resolveDefaultTimezone } from '@shared/constants/timezones'
import { nowIso } from '@shared/utils/time'

interface SettingRow {
  key: string
  value: string
}

const DEFAULT_SETTINGS: AppSettings = {
  openrouterModel: '',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: '',
  defaultStalenessHours: 24,
  microBreakIntervalMinutes: 90,
  minViableBlockMinutes: 15,
  defaultBufferPercent: 10,
  doomscrollAllowanceMinutes: 5,
  timeFormat: '12h',
  weekStartsOn: 'sunday',
  dateFormat: 'mdy',
  defaultSleepTime: '23:00',
  timezone: resolveDefaultTimezone(),
  notifications: {
    microBreak: true,
    staleness: true,
    insightReady: false,
    clientReminder: true,
    blockReminder: true,
  },
  themeAccent: '#2DD4A0',
  onboardingComplete: false,
  userDisplayName: '',
  sidebarExpanded: true,
  launchAtLogin: false,
  trayCloseTipShown: false,
}

const KEY_MAP: Record<keyof AppSettings, string> = {
  openrouterModel: 'openrouter_model',
  ollamaEndpoint: 'ollama_endpoint',
  ollamaModel: 'ollama_model',
  defaultStalenessHours: 'default_staleness_hours',
  microBreakIntervalMinutes: 'micro_break_interval_minutes',
  minViableBlockMinutes: 'min_viable_block_minutes',
  defaultBufferPercent: 'default_buffer_percent',
  doomscrollAllowanceMinutes: 'doomscroll_allowance_minutes',
  timeFormat: 'time_format',
  weekStartsOn: 'week_starts_on',
  dateFormat: 'date_format',
  defaultSleepTime: 'default_sleep_time',
  timezone: 'timezone',
  notifications: 'notifications',
  themeAccent: 'theme_accent',
  onboardingComplete: 'onboarding_complete',
  userDisplayName: 'user_display_name',
  sidebarExpanded: 'sidebar_expanded',
  launchAtLogin: 'launch_at_login',
  trayCloseTipShown: 'tray_close_tip_shown',
}

function parseSettingValue<T>(raw: string): T {
  return JSON.parse(raw) as T
}

function rowToPartialSettings(row: SettingRow): Partial<AppSettings> {
  const entry = Object.entries(KEY_MAP).find(([, dbKey]) => dbKey === row.key)
  if (!entry) {
    return {}
  }

  const [settingsKey] = entry as [keyof AppSettings, string]
  return { [settingsKey]: parseSettingValue(row.value) } as Partial<AppSettings>
}

export function getAllSettings(db: Database.Database): AppSettings {
  const rows = db.prepare('SELECT key, value FROM app_settings').all() as SettingRow[]
  const merged: AppSettings = { ...DEFAULT_SETTINGS }

  for (const row of rows) {
    Object.assign(merged, rowToPartialSettings(row))
  }

  return {
    ...merged,
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...merged.notifications,
    },
  }
}

export function getSettingValue<T>(db: Database.Database, key: string, fallback: T): T {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined

  if (!row) {
    return fallback
  }

  return parseSettingValue<T>(row.value)
}

export function upsertSettings(db: Database.Database, update: AppSettingsUpdate): AppSettings {
  const upsert = db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `)

  const apply = db.transaction((partial: AppSettingsUpdate) => {
    const timestamp = nowIso()
    for (const [settingsKey, value] of Object.entries(partial) as Array<
      [keyof AppSettings, AppSettings[keyof AppSettings]]
    >) {
      if (value === undefined) {
        continue
      }
      upsert.run({
        key: KEY_MAP[settingsKey],
        value: JSON.stringify(value),
        updated_at: timestamp,
      })
    }
  })

  apply(update)
  return getAllSettings(db)
}
