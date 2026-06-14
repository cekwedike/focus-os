export interface ReviewDateRangePayload {
  startDate: string
  endDate: string
}

export interface PlannedActualGroup {
  id: string
  label: string
  plannedMinutes: number
  actualMinutes: number
  notStartedCount: number
  completedCount: number
}

export interface ProtectedBlockDaySummary {
  protectedSubtype: string
  label: string
  daysWithBlock: number
  daysCompleted: number
}

export interface LongBreakReasonSummary {
  reason: string
  count: number
  totalMinutes: number
}

export interface BreakTypeSummary {
  count: number
  totalMinutes: number
}

export interface ReviewSummary {
  startDate: string
  endDate: string
  clientGroups: PlannedActualGroup[]
  protectedGroups: PlannedActualGroup[]
  protectedDaySummaries: ProtectedBlockDaySummary[]
  microBreaks: BreakTypeSummary
  longBreaks: BreakTypeSummary
  longBreakReasons: LongBreakReasonSummary[]
  taskCompletionRate: number | null
  scheduledTaskBlocks: number
  completedTaskBlocks: number
}

export interface ReviewScheduleRow {
  schedule_date: string
  block_type: string
  protected_subtype: string | null
  client_id: number | null
  client_name: string | null
  planned_duration_minutes: number
  actual_duration_minutes: number | null
  actual_start: string | null
  actual_end: string | null
  status: string
  task_id: number | null
}

export interface ReviewBreakRow {
  break_type: string
  reason: string | null
  duration_minutes: number | null
}
