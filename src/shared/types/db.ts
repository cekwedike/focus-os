export type ProtectedBlockType =
  | 'morning_routine'
  | 'faith'
  | 'meal'
  | 'micro_break'
  | 'winddown'

export type ProtectedAnchorType = 'wake_offset' | 'fixed_time' | 'relative'

export interface ClientProjectRow {
  id: number
  name: string
  color: string
  weight_percent: number
  is_active: number
  fixed_block_enabled: number
  fixed_block_start: string | null
  fixed_block_duration_minutes: number | null
  last_touched_at: string | null
  staleness_threshold_hours: number | null
  reminder_enabled: number
  reminder_interval_minutes: number | null
  reminder_label: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CheckInLogRow {
  id: number
  client_project_id: number
  check_in_date: string
  scheduled_at: string
  acknowledged_at: string
  actual_interval_minutes: number | null
  created_at: string
}

export interface ProtectedBlockRow {
  id: number
  block_type: ProtectedBlockType
  label: string
  duration_minutes: number
  anchor_type: ProtectedAnchorType
  anchor_value: string
  sort_order: number
  is_enabled: number
  created_at: string
  updated_at: string
}

export interface CreateClientProjectInput {
  name: string
  color: string
  weight_percent?: number
  is_active?: boolean
  fixed_block_enabled?: boolean
  fixed_block_start?: string | null
  fixed_block_duration_minutes?: number | null
  staleness_threshold_hours?: number | null
  reminder_enabled?: boolean
  reminder_interval_minutes?: number | null
  reminder_label?: string | null
  sort_order?: number
}

export interface UpdateClientProjectInput {
  id: number
  name?: string
  color?: string
  weight_percent?: number
  is_active?: boolean
  fixed_block_enabled?: boolean
  fixed_block_start?: string | null
  fixed_block_duration_minutes?: number | null
  staleness_threshold_hours?: number | null
  reminder_enabled?: boolean
  reminder_interval_minutes?: number | null
  reminder_label?: string | null
  sort_order?: number
}

export interface CreateProtectedBlockInput {
  block_type: ProtectedBlockType
  label: string
  duration_minutes: number
  anchor_type: ProtectedAnchorType
  anchor_value: string
  sort_order?: number
  is_enabled?: boolean
}

export interface UpdateProtectedBlockInput {
  id: number
  block_type?: ProtectedBlockType
  label?: string
  duration_minutes?: number
  anchor_type?: ProtectedAnchorType
  anchor_value?: string
  sort_order?: number
  is_enabled?: boolean
}

export interface DbHealthResponse {
  databasePath: string
  schemaVersion: number
  tableCount: number
  clientCount: number
  protectedBlockCount: number
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred'

export interface TaskRow {
  id: number
  client_id: number
  title: string
  description: string | null
  priority: number
  deadline_date: string | null
  estimated_minutes: number | null
  status: TaskStatus
  deferred_to_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type ScheduleBlockType =
  | 'protected'
  | 'fixed_client'
  | 'weighted_client'
  | 'buffer'
  | 'break'

export type ScheduleBlockStatus =
  | 'planned'
  | 'active'
  | 'completed'
  | 'skipped'
  | 'compressed'
  | 'superseded'

export interface DailyScheduleRow {
  id: number
  schedule_date: string
  block_type: ScheduleBlockType
  protected_subtype: string | null
  client_id: number | null
  task_id: number | null
  title: string
  planned_start: string
  planned_end: string
  planned_duration_minutes: number
  actual_start: string | null
  actual_end: string | null
  actual_duration_minutes: number | null
  status: ScheduleBlockStatus
  priority_order: number
  metadata_json: string | null
  created_at: string
  updated_at: string
}

export interface DailySettingsRow {
  id: number
  settings_date: string
  wake_time: string | null
  sleep_target_time: string | null
  buffer_percent: number
  remaining_minutes_at_wake: number | null
  allocation_version: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type BreakLogType = 'micro' | 'long'

export interface BreakLogRow {
  id: number
  break_date: string
  break_type: BreakLogType
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  reason: string | null
  activity: string | null
  client_id: number | null
  schedule_block_id: number | null
  created_at: string
}

export interface FaithLogRow {
  id: number
  entry_date: string
  bible_reference: string | null
  prayer_notes: string | null
  word_count: number
  created_at: string
  updated_at: string
}
