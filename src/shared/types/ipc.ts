import type {
  ClientProjectRow,
  CreateClientProjectInput,
  CreateProtectedBlockInput,
  DbHealthResponse,
  ProtectedBlockRow,
  UpdateClientProjectInput,
  UpdateProtectedBlockInput,
} from './db'

export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

export type { DbHealthResponse }

export type IpcInvokeChannel =
  | 'app:ping'
  | 'db:health'
  | 'clients:list'
  | 'clients:get'
  | 'clients:create'
  | 'clients:update'
  | 'clients:delete'
  | 'protected-blocks:list'
  | 'protected-blocks:get'
  | 'protected-blocks:create'
  | 'protected-blocks:update'
  | 'protected-blocks:delete'
  | 'schedule:generate'
  | 'schedule:commit'
  | 'schedule:reallocate'
  | 'schedule:get-day'
  | 'schedule:start-block'
  | 'schedule:complete-block'
  | 'schedule:complete-and-advance'
  | 'schedule:extend-block'
  | 'schedule:skip-block'
  | 'schedule:update-block'
  | 'tasks:list'
  | 'tasks:get'
  | 'tasks:create'
  | 'tasks:update'
  | 'tasks:delete'
  | 'daily:get'
  | 'daily:upsert'
  | 'journal:get-entry'
  | 'journal:upsert'
  | 'journal:list'
  | 'journal:list-range'
  | 'journal:stats'
  | 'journal:complete-faith-block'
  | 'review:get-summary'
  | 'insights:generate'
  | 'insights:get-today'
  | 'insights:list'
  | 'settings:get'
  | 'settings:update'
  | 'settings:test-ai-providers'
  | 'settings:openrouter-key-status'
  | 'settings:set-openrouter-key'
  | 'settings:clear-openrouter-key'
  | 'breaks:list'
  | 'breaks:create'
  | 'breaks:update'
  | 'breaks:log'
  | 'work:set-paused'
  | 'work:get-paused'
  | 'check-ins:get-due'
  | 'check-ins:acknowledge'
  | 'notification:list-active'
  | 'notification:action'

export type IpcEventChannel =
  | 'app:navigate'
  | 'schedule:block-changed'
  | 'notification:dispatched'
  | 'notification:state-changed'
  | 'notification:acknowledged'

export interface AppNavigatePayload {
  path: string
}

export type {
  NotificationDispatchedPayload,
  NotificationStateChangedPayload,
  NotificationAcknowledgedPayload,
  NotificationActionPayload,
  NotificationActionResponse,
  NotificationListActiveResponse,
  ActiveNotificationSummary,
} from './notifications'

export interface WorkGetPausedResponse {
  paused: boolean
}

export interface WorkSetPausedPayload {
  paused: boolean
}

export interface WorkSetPausedResponse {
  paused: boolean
}

export interface DueCheckInEntry {
  clientId: number
  clientName: string
  label: string
  dueAt: string
  overdueMinutes: number
}

export interface CheckInsGetDueResponse {
  due: DueCheckInEntry[]
}

export interface ScheduleBlockChangedPayload {
  scheduleDate: string
  blockId: number
  nextBlockId?: number | null
  reason: 'auto_completed' | 'manual_completed' | 'skipped' | 'extended'
}

export interface AppPingResponse {
  version: string
  ready: boolean
  databaseReady: boolean
}

export interface ClientGetPayload {
  id: number
}

export interface ClientDeletePayload {
  id: number
}

export interface ProtectedBlockGetPayload {
  id: number
}

export interface ProtectedBlockDeletePayload {
  id: number
}

export type ClientsListResponse = ClientProjectRow[]
export type ClientsGetResponse = ClientProjectRow
export type ClientsCreatePayload = CreateClientProjectInput
export type ClientsCreateResponse = ClientProjectRow
export type ClientsUpdatePayload = UpdateClientProjectInput
export type ClientsUpdateResponse = ClientProjectRow
export type ClientsDeleteResponse = { deleted: boolean }

export type ProtectedBlocksListResponse = ProtectedBlockRow[]
export type ProtectedBlocksGetResponse = ProtectedBlockRow
export type ProtectedBlocksCreatePayload = CreateProtectedBlockInput
export type ProtectedBlocksCreateResponse = ProtectedBlockRow
export type ProtectedBlocksUpdatePayload = UpdateProtectedBlockInput
export type ProtectedBlocksUpdateResponse = ProtectedBlockRow
export type ProtectedBlocksDeleteResponse = { deleted: boolean }

export type DbHealthResult = IpcResult<DbHealthResponse>
export type ClientsListResult = IpcResult<ClientsListResponse>
export type ClientsGetResult = IpcResult<ClientsGetResponse>
export type ClientsCreateResult = IpcResult<ClientsCreateResponse>
export type ClientsUpdateResult = IpcResult<ClientsUpdateResponse>
export type ClientsDeleteResult = IpcResult<ClientsDeleteResponse>
export type ProtectedBlocksListResult = IpcResult<ProtectedBlocksListResponse>
export type ProtectedBlocksGetResult = IpcResult<ProtectedBlocksGetResponse>
export type ProtectedBlocksCreateResult = IpcResult<ProtectedBlocksCreateResponse>
export type ProtectedBlocksUpdateResult = IpcResult<ProtectedBlocksUpdateResponse>
export type ProtectedBlocksDeleteResult = IpcResult<ProtectedBlocksDeleteResponse>

export type {
  AppSettings,
  AppSettingsUpdate,
  OpenRouterKeyStatusResponse,
  SetOpenRouterKeyPayload,
  SettingsGetResponse,
} from './settings'

export type SettingsGetResult = IpcResult<import('./settings').SettingsGetResponse>
export type SettingsUpdateResult = IpcResult<import('./settings').SettingsGetResponse>
export type OpenRouterKeyStatusResult = IpcResult<import('./settings').OpenRouterKeyStatusResponse>
export type SetOpenRouterKeyResult = IpcResult<import('./settings').OpenRouterKeyStatusResponse>
export type ClearOpenRouterKeyResult = IpcResult<import('./settings').OpenRouterKeyStatusResponse>
