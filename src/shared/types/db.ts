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
  sort_order: number
  created_at: string
  updated_at: string
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
