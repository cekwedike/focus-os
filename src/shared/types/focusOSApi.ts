import type {
  AppPingResponse,
  ClientDeletePayload,
  ClientGetPayload,
  ClientsCreatePayload,
  ClientsCreateResponse,
  ClientsDeleteResponse,
  ClientsGetResponse,
  ClientsListResponse,
  ClientsUpdatePayload,
  ClientsUpdateResponse,
  DbHealthResponse,
  IpcInvokeChannel,
  IpcResult,
  AppNavigatePayload,
  NotificationAcknowledgedPayload,
  NotificationActionPayload,
  NotificationActionResponse,
  NotificationDispatchedPayload,
  NotificationListActiveResponse,
  NotificationStateChangedPayload,
  ScheduleBlockChangedPayload,
  ProtectedBlockDeletePayload,
  ProtectedBlockGetPayload,
  ProtectedBlocksCreatePayload,
  ProtectedBlocksCreateResponse,
  ProtectedBlocksDeleteResponse,
  ProtectedBlocksGetResponse,
  ProtectedBlocksListResponse,
  ProtectedBlocksUpdatePayload,
  ProtectedBlocksUpdateResponse,
} from './ipc'
import type {
  AppSettingsUpdate,
  OpenRouterKeyStatusResponse,
  SetOpenRouterKeyPayload,
  SettingsGetResponse,
} from './settings'
import type { TaskRow } from './db'
import type { CreateTaskInput, TaskListFilters, TaskWithClient, UpdateTaskInput } from './tasks'
import type {
  DailyUpsertInput,
  DayBundle,
  BlockProgressionResult,
  ScheduleCommitPayload,
  ScheduleGeneratePayload,
  ScheduleGetDayPayload,
  ScheduleReallocatePayload,
  ScheduleUpdateBlockPayload,
} from './schedule'
import type { AllocationOutput } from '@shared/allocation/types'
import type { DailyScheduleRow, DailySettingsRow } from './db'
import type { BreakListFilters, CreateBreakInput, UpdateBreakInput } from './breaks'
import type { BreakLogRow } from './db'
import type {
  JournalCompleteFaithBlockPayload,
  JournalCompleteFaithBlockResponse,
  JournalGetEntryPayload,
  JournalGetEntryResponse,
  JournalListRangePayload,
  JournalListResponse,
  JournalStatsPayload,
  JournalStatsResponse,
  JournalUpsertPayload,
} from './journal'
import type { ReviewDateRangePayload, ReviewSummary } from './review'
import type {
  InsightsGeneratePayload,
  InsightsGenerateResponse,
  InsightsGetTodayPayload,
  InsightsGetTodayResponse,
  InsightsListPayload,
  InsightsListResponse,
  TestAiProvidersResponse,
} from './insights'

export type Unsubscribe = () => void

export interface FocusOSApi {
  invoke<T>(channel: IpcInvokeChannel, payload?: unknown): Promise<IpcResult<T>>
  ping(): Promise<AppPingResponse>
  dbHealth(): Promise<DbHealthResponse>
  clients: {
    list(): Promise<ClientsListResponse>
    get(payload: ClientGetPayload): Promise<ClientsGetResponse>
    create(payload: ClientsCreatePayload): Promise<ClientsCreateResponse>
    update(payload: ClientsUpdatePayload): Promise<ClientsUpdateResponse>
    delete(payload: ClientDeletePayload): Promise<ClientsDeleteResponse>
  }
  protectedBlocks: {
    list(): Promise<ProtectedBlocksListResponse>
    get(payload: ProtectedBlockGetPayload): Promise<ProtectedBlocksGetResponse>
    create(payload: ProtectedBlocksCreatePayload): Promise<ProtectedBlocksCreateResponse>
    update(payload: ProtectedBlocksUpdatePayload): Promise<ProtectedBlocksUpdateResponse>
    delete(payload: ProtectedBlockDeletePayload): Promise<ProtectedBlocksDeleteResponse>
  }
  tasks: {
    list(filters?: TaskListFilters): Promise<TaskWithClient[]>
    get(payload: { id: number }): Promise<TaskRow>
    create(payload: CreateTaskInput): Promise<TaskRow>
    update(payload: UpdateTaskInput): Promise<TaskRow>
    delete(payload: { id: number }): Promise<{ deleted: boolean }>
  }
  daily: {
    get(payload: { date: string }): Promise<{
      settings: DailySettingsRow | null
      yesterday: DailySettingsRow | null
    }>
    upsert(payload: DailyUpsertInput): Promise<DailySettingsRow>
  }
  schedule: {
    generate(payload: ScheduleGeneratePayload): Promise<AllocationOutput>
    commit(payload: ScheduleCommitPayload): Promise<DayBundle>
    getDay(payload: ScheduleGetDayPayload): Promise<DayBundle>
    startBlock(payload: { blockId: number }): Promise<DailyScheduleRow>
    completeBlock(payload: { blockId: number }): Promise<DailyScheduleRow>
    completeAndAdvance(payload: {
      blockId: number
      endTime?: string
    }): Promise<BlockProgressionResult>
    extendBlock(payload: { blockId: number; minutes?: number }): Promise<DailyScheduleRow>
    skipBlock(payload: { blockId: number }): Promise<BlockProgressionResult>
    updateBlock(payload: ScheduleUpdateBlockPayload): Promise<DailyScheduleRow>
    reallocate(payload: ScheduleReallocatePayload): Promise<
      AllocationOutput & { replanSummary: import('@shared/allocation/types').ReplanSummary; dayBundle: DayBundle }
    >
  }
  breaks: {
    list(filters?: BreakListFilters): Promise<BreakLogRow[]>
    create(payload: CreateBreakInput): Promise<BreakLogRow>
    update(payload: UpdateBreakInput): Promise<BreakLogRow>
    log(payload: CreateBreakInput): Promise<BreakLogRow>
  }
  journal: {
    getEntry(payload: JournalGetEntryPayload): Promise<JournalGetEntryResponse>
    upsert(payload: JournalUpsertPayload): Promise<import('./db').FaithLogRow>
    list(): Promise<JournalListResponse>
    listRange(payload: JournalListRangePayload): Promise<JournalListResponse>
    stats(payload: JournalStatsPayload): Promise<JournalStatsResponse>
    completeFaithBlock(
      payload: JournalCompleteFaithBlockPayload
    ): Promise<JournalCompleteFaithBlockResponse>
  }
  review: {
    getSummary(payload: ReviewDateRangePayload): Promise<ReviewSummary>
  }
  insights: {
    generate(payload?: InsightsGeneratePayload): Promise<InsightsGenerateResponse>
    getToday(payload?: InsightsGetTodayPayload): Promise<InsightsGetTodayResponse>
    list(payload?: InsightsListPayload): Promise<InsightsListResponse>
  }
  settings: {
    get(): Promise<SettingsGetResponse>
    update(payload: AppSettingsUpdate): Promise<SettingsGetResponse>
    openRouterKeyStatus(): Promise<OpenRouterKeyStatusResponse>
    setOpenRouterKey(payload: SetOpenRouterKeyPayload): Promise<OpenRouterKeyStatusResponse>
    clearOpenRouterKey(): Promise<OpenRouterKeyStatusResponse>
    testAiProviders(): Promise<TestAiProvidersResponse>
  }
  work: {
    setPaused(payload: { paused: boolean }): Promise<{ paused: boolean }>
    getPaused(): Promise<{ paused: boolean }>
  }
  checkIns: {
    getDue(): Promise<import('./ipc').CheckInsGetDueResponse>
    acknowledge(payload: { clientId: number }): Promise<import('./ipc').CheckInsGetDueResponse>
  }
  notifications: {
    listActive(): Promise<NotificationListActiveResponse>
    action(payload: NotificationActionPayload): Promise<NotificationActionResponse>
  }
  onNavigate(callback: (payload: AppNavigatePayload) => void): Unsubscribe
  onNotificationDispatched(callback: (payload: NotificationDispatchedPayload) => void): Unsubscribe
  onNotificationStateChanged(callback: (payload: NotificationStateChangedPayload) => void): Unsubscribe
  onNotificationAcknowledged(callback: (payload: NotificationAcknowledgedPayload) => void): Unsubscribe
  onScheduleBlockChanged(callback: (payload: ScheduleBlockChangedPayload) => void): Unsubscribe
}
