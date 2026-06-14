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
  | 'schedule:reallocate'
  | 'schedule:get-day'
  | 'schedule:complete-block'
  | 'tasks:list'
  | 'journal:get-entry'
  | 'insights:generate'
  | 'settings:get'
  | 'breaks:log'

export type IpcEventChannel = 'break:micro-break-due' | 'staleness:alert'

export interface MicroBreakDuePayload {
  suggestedActivities: string[]
}

export interface StalenessAlertPayload {
  clientId: number
  clientName: string
  hoursSinceTouch: number
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
