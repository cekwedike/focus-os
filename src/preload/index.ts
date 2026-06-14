import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
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
  AppNavigatePayload,
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
} from '@shared/types/ipc'
import type {
  AppSettingsUpdate,
  OpenRouterKeyStatusResponse,
  SetOpenRouterKeyPayload,
  SettingsGetResponse,
} from '@shared/types/settings'
import type { FocusOSApi, Unsubscribe } from '@shared/types/focusOSApi'

const invokeChannels: IpcInvokeChannel[] = [
  'app:ping',
  'db:health',
  'clients:list',
  'clients:get',
  'clients:create',
  'clients:update',
  'clients:delete',
  'protected-blocks:list',
  'protected-blocks:get',
  'protected-blocks:create',
  'protected-blocks:update',
  'protected-blocks:delete',
  'schedule:generate',
  'schedule:reallocate',
  'schedule:get-day',
  'schedule:complete-block',
  'tasks:list',
  'journal:get-entry',
  'insights:generate',
  'settings:get',
  'settings:update',
  'settings:openrouter-key-status',
  'settings:set-openrouter-key',
  'settings:clear-openrouter-key',
  'breaks:log',
]

const eventChannels: IpcEventChannel[] = [
  'break:micro-break-due',
  'staleness:alert',
  'app:navigate',
]

function createInvoke<T>(channel: IpcInvokeChannel, payload?: unknown): Promise<IpcResult<T>> {
  if (!invokeChannels.includes(channel)) {
    return Promise.resolve({
      ok: false,
      error: { code: 'CHANNEL_NOT_ALLOWED', message: `Channel not allowed: ${channel}` },
    })
  }
  return ipcRenderer.invoke(channel, payload) as Promise<IpcResult<T>>
}

async function unwrap<T>(result: IpcResult<T>): Promise<T> {
  if (!result.ok) {
    throw new Error(result.error.message)
  }
  return result.data
}

function subscribeToEvent<T>(
  channel: IpcEventChannel,
  callback: (payload: T) => void
): Unsubscribe {
  if (!eventChannels.includes(channel)) {
    return () => undefined
  }

  const listener = (_event: IpcRendererEvent, payload: T): void => {
    callback(payload)
  }

  ipcRenderer.on(channel, listener)

  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const focusOSApi: FocusOSApi = {
  invoke: createInvoke,
  ping: async () => unwrap(await createInvoke<AppPingResponse>('app:ping')),
  dbHealth: async () => unwrap(await createInvoke<DbHealthResponse>('db:health')),
  clients: {
    list: async () => unwrap(await createInvoke<ClientsListResponse>('clients:list')),
    get: async (payload: ClientGetPayload) =>
      unwrap(await createInvoke<ClientsGetResponse>('clients:get', payload)),
    create: async (payload: ClientsCreatePayload) =>
      unwrap(await createInvoke<ClientsCreateResponse>('clients:create', payload)),
    update: async (payload: ClientsUpdatePayload) =>
      unwrap(await createInvoke<ClientsUpdateResponse>('clients:update', payload)),
    delete: async (payload: ClientDeletePayload) =>
      unwrap(await createInvoke<ClientsDeleteResponse>('clients:delete', payload)),
  },
  protectedBlocks: {
    list: async () =>
      unwrap(await createInvoke<ProtectedBlocksListResponse>('protected-blocks:list')),
    get: async (payload: ProtectedBlockGetPayload) =>
      unwrap(await createInvoke<ProtectedBlocksGetResponse>('protected-blocks:get', payload)),
    create: async (payload: ProtectedBlocksCreatePayload) =>
      unwrap(
        await createInvoke<ProtectedBlocksCreateResponse>('protected-blocks:create', payload)
      ),
    update: async (payload: ProtectedBlocksUpdatePayload) =>
      unwrap(
        await createInvoke<ProtectedBlocksUpdateResponse>('protected-blocks:update', payload)
      ),
    delete: async (payload: ProtectedBlockDeletePayload) =>
      unwrap(
        await createInvoke<ProtectedBlocksDeleteResponse>('protected-blocks:delete', payload)
      ),
  },
  settings: {
    get: async () => unwrap(await createInvoke<SettingsGetResponse>('settings:get')),
    update: async (payload: AppSettingsUpdate) =>
      unwrap(await createInvoke<SettingsGetResponse>('settings:update', payload)),
    openRouterKeyStatus: async () =>
      unwrap(await createInvoke<OpenRouterKeyStatusResponse>('settings:openrouter-key-status')),
    setOpenRouterKey: async (payload: SetOpenRouterKeyPayload) =>
      unwrap(await createInvoke<OpenRouterKeyStatusResponse>('settings:set-openrouter-key', payload)),
    clearOpenRouterKey: async () =>
      unwrap(await createInvoke<OpenRouterKeyStatusResponse>('settings:clear-openrouter-key')),
  },
  onMicroBreakDue: (callback) =>
    subscribeToEvent<MicroBreakDuePayload>('break:micro-break-due', callback),
  onStalenessAlert: (callback) =>
    subscribeToEvent<StalenessAlertPayload>('staleness:alert', callback),
  onNavigate: (callback) => subscribeToEvent<AppNavigatePayload>('app:navigate', callback),
}

contextBridge.exposeInMainWorld('focusOS', focusOSApi)
