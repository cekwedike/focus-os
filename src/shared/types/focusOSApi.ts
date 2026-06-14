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
  IpcEventChannel,
  IpcInvokeChannel,
  IpcResult,
  MicroBreakDuePayload,
  ProtectedBlockDeletePayload,
  ProtectedBlockGetPayload,
  ProtectedBlocksCreatePayload,
  ProtectedBlocksCreateResponse,
  ProtectedBlocksDeleteResponse,
  ProtectedBlocksGetResponse,
  ProtectedBlocksListResponse,
  ProtectedBlocksUpdatePayload,
  ProtectedBlocksUpdateResponse,
  StalenessAlertPayload,
} from './ipc'
import type { Unsubscribe } from './focusOSApi'

export type { Unsubscribe }

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
  onMicroBreakDue(callback: (payload: MicroBreakDuePayload) => void): Unsubscribe
  onStalenessAlert(callback: (payload: StalenessAlertPayload) => void): Unsubscribe
}
