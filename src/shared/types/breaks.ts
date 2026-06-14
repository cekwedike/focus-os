import type { BreakLogRow } from './db'

export type BreakType = 'micro' | 'long'

export type MicroBreakActivity =
  | 'read'
  | 'walk'
  | 'call'
  | 'messages'
  | 'doomscroll'
  | 'skip'

export interface BreakListFilters {
  breakDate?: string
  breakType?: BreakType
}

export interface CreateBreakInput {
  break_date: string
  break_type: BreakType
  started_at: string
  ended_at?: string | null
  duration_minutes?: number | null
  reason?: string | null
  activity?: string | null
  client_id?: number | null
  schedule_block_id?: number | null
}

export interface UpdateBreakInput {
  id: number
  ended_at?: string | null
  duration_minutes?: number | null
  reason?: string | null
  activity?: string | null
}

export type BreakListResponse = BreakLogRow[]
