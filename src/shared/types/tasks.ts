import type { TaskRow } from './db'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred'

export interface TaskListFilters {
  clientId?: number
  priority?: number
  priorityMax?: number
  status?: TaskStatus
  recentOnly?: boolean
  quadrant?: 'do_first' | 'schedule' | 'delegate' | 'eliminate' | 'unset'
}

export interface CreateTaskInput {
  client_id: number
  title: string
  description?: string | null
  priority?: number
  is_urgent?: boolean | null
  is_important?: boolean | null
  deadline_date?: string | null
  estimated_minutes?: number | null
  status?: TaskStatus
}

export interface UpdateTaskInput {
  id: number
  client_id?: number
  title?: string
  description?: string | null
  priority?: number
  is_urgent?: boolean | null
  is_important?: boolean | null
  deadline_date?: string | null
  estimated_minutes?: number | null
  status?: TaskStatus
  deferred_to_date?: string | null
}

export interface TaskWithClient extends TaskRow {
  client_name: string
  client_color: string
}
