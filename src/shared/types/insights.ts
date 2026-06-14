import type { ReviewSummary } from './review'

export type InsightSource = 'openrouter' | 'ollama' | 'none'

export interface InsightLogRow {
  id: number
  insight_date: string
  source: InsightSource
  model: string | null
  prompt_snapshot_json: string | null
  content_markdown: string
  generation_ms: number | null
  error_message: string | null
  created_at: string
}

export interface SnapshotScheduleBlock {
  title: string
  blockType: string
  protectedSubtype: string | null
  clientName: string | null
  plannedMinutes: number
  actualMinutes: number | null
  status: string
  taskTitle: string | null
}

export interface SnapshotTaskItem {
  id: number
  title: string
  priority: number
  status: string
  deadlineDate: string | null
}

export interface SnapshotClientTasks {
  clientId: number
  clientName: string
  pending: SnapshotTaskItem[]
  completed: SnapshotTaskItem[]
}

export interface SnapshotStaleClient {
  clientId: number
  clientName: string
  hoursSinceTouch: number
}

export interface SnapshotBumpedTask {
  id: number
  title: string
  clientName: string
  deferredToDate: string
}

export interface SnapshotFaithSummary {
  currentStreak: number
  longestStreak: number
  todayEntryLogged: boolean
  todayBibleReference: string | null
}

export interface DailyInsightSnapshot {
  scheduleDate: string
  generatedAt: string
  blocks: SnapshotScheduleBlock[]
  tasksByClient: SnapshotClientTasks[]
  staleClients: SnapshotStaleClient[]
  faith: SnapshotFaithSummary
  yesterdaySummary: ReviewSummary | null
  bumpedTasks: SnapshotBumpedTask[]
}

export interface InsightGenerationResult {
  source: InsightSource
  model: string | null
  contentMarkdown: string
  generationMs: number
  errorMessage: string | null
  snapshot: DailyInsightSnapshot
}

export interface InsightsGeneratePayload {
  date?: string
}

export interface InsightsGetTodayPayload {
  date?: string
}

export interface InsightsListPayload {
  limit?: number
}

export type InsightsGetTodayResponse = InsightLogRow | null
export type InsightsListResponse = InsightLogRow[]
export type InsightsGenerateResponse = InsightLogRow

export type AiProviderTestStatus = 'ok' | 'skipped' | 'failed'

export interface TestAiProvidersResponse {
  openrouter: AiProviderTestStatus
  ollama: AiProviderTestStatus
  openrouterMessage?: string
  ollamaMessage?: string
}
