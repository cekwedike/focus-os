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
  NotificationAcknowledgedPayload,
  NotificationActionPayload,
  NotificationActionResponse,
  NotificationDispatchedPayload,
  NotificationListActiveResponse,
  NotificationStateChangedPayload,
  ScheduleBlockChangedPayload,
  CheckInsGetDueResponse,
  ProtectedBlockDeletePayload,
  ProtectedBlockGetPayload,
  ProtectedBlocksCreatePayload,
  ProtectedBlocksCreateResponse,
  ProtectedBlocksDeleteResponse,
  ProtectedBlocksGetResponse,
  ProtectedBlocksListResponse,
  ProtectedBlocksUpdatePayload,
  ProtectedBlocksUpdateResponse,
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
  'schedule:commit',
  'schedule:reallocate',
  'schedule:get-day',
  'schedule:start-block',
  'schedule:complete-block',
  'schedule:complete-and-advance',
  'schedule:extend-block',
  'schedule:skip-block',
  'schedule:update-block',
  'tasks:list',
  'tasks:get',
  'tasks:create',
  'tasks:update',
  'tasks:delete',
  'daily:get',
  'daily:upsert',
  'journal:get-entry',
  'journal:upsert',
  'journal:list',
  'journal:list-range',
  'journal:stats',
  'journal:complete-faith-block',
  'review:get-summary',
  'insights:generate',
  'insights:get-today',
  'insights:list',
  'settings:get',
  'settings:update',
  'settings:test-ai-providers',
  'settings:openrouter-key-status',
  'settings:set-openrouter-key',
  'settings:clear-openrouter-key',
  'breaks:list',
  'breaks:create',
  'breaks:update',
  'breaks:log',
  'work:set-paused',
  'work:get-paused',
  'check-ins:get-due',
  'check-ins:acknowledge',
  'chat:ai-fallback',
  'notification:list-active',
  'notification:action',
]

const eventChannels: IpcEventChannel[] = [
  'app:navigate',
  'schedule:block-changed',
  'notification:dispatched',
  'notification:state-changed',
  'notification:acknowledged',
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
  tasks: {
    list: async (filters) => unwrap(await createInvoke('tasks:list', filters)),
    get: async (payload) => unwrap(await createInvoke('tasks:get', payload)),
    create: async (payload) => unwrap(await createInvoke('tasks:create', payload)),
    update: async (payload) => unwrap(await createInvoke('tasks:update', payload)),
    delete: async (payload) => unwrap(await createInvoke('tasks:delete', payload)),
  },
  daily: {
    get: async (payload) => unwrap(await createInvoke('daily:get', payload)),
    upsert: async (payload) => unwrap(await createInvoke('daily:upsert', payload)),
  },
  schedule: {
    generate: async (payload) => unwrap(await createInvoke('schedule:generate', payload)),
    commit: async (payload) => unwrap(await createInvoke('schedule:commit', payload)),
    getDay: async (payload) => unwrap(await createInvoke('schedule:get-day', payload)),
    startBlock: async (payload) => unwrap(await createInvoke('schedule:start-block', payload)),
    completeBlock: async (payload) => unwrap(await createInvoke('schedule:complete-block', payload)),
    completeAndAdvance: async (payload) =>
      unwrap(await createInvoke('schedule:complete-and-advance', payload)),
    extendBlock: async (payload) => unwrap(await createInvoke('schedule:extend-block', payload)),
    skipBlock: async (payload) => unwrap(await createInvoke('schedule:skip-block', payload)),
    updateBlock: async (payload) => unwrap(await createInvoke('schedule:update-block', payload)),
    reallocate: async (payload) => unwrap(await createInvoke('schedule:reallocate', payload)),
  },
  breaks: {
    list: async (filters) => unwrap(await createInvoke('breaks:list', filters)),
    create: async (payload) => unwrap(await createInvoke('breaks:create', payload)),
    update: async (payload) => unwrap(await createInvoke('breaks:update', payload)),
    log: async (payload) => unwrap(await createInvoke('breaks:log', payload)),
  },
  journal: {
    getEntry: async (payload) => unwrap(await createInvoke('journal:get-entry', payload)),
    upsert: async (payload) => unwrap(await createInvoke('journal:upsert', payload)),
    list: async () => unwrap(await createInvoke('journal:list')),
    listRange: async (payload) => unwrap(await createInvoke('journal:list-range', payload)),
    stats: async (payload) => unwrap(await createInvoke('journal:stats', payload)),
    completeFaithBlock: async (payload) =>
      unwrap(await createInvoke('journal:complete-faith-block', payload)),
  },
  review: {
    getSummary: async (payload) => unwrap(await createInvoke('review:get-summary', payload)),
  },
  insights: {
    generate: async (payload) => unwrap(await createInvoke('insights:generate', payload)),
    getToday: async (payload) => unwrap(await createInvoke('insights:get-today', payload)),
    list: async (payload) => unwrap(await createInvoke('insights:list', payload)),
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
    testAiProviders: async () =>
      unwrap(await createInvoke('settings:test-ai-providers')),
  },
  work: {
    setPaused: async (payload: { paused: boolean }) =>
      unwrap(await createInvoke('work:set-paused', payload)),
    getPaused: async () => unwrap(await createInvoke<{ paused: boolean }>('work:get-paused')),
  },
  checkIns: {
    getDue: async () => unwrap(await createInvoke<CheckInsGetDueResponse>('check-ins:get-due')),
    acknowledge: async (payload: { clientId: number }) =>
      unwrap(await createInvoke<CheckInsGetDueResponse>('check-ins:acknowledge', payload)),
  },
  chat: {
    aiFallback: async (payload) => unwrap(await createInvoke('chat:ai-fallback', payload)),
  },
  notifications: {
    listActive: async () =>
      unwrap(await createInvoke<NotificationListActiveResponse>('notification:list-active')),
    action: async (payload: NotificationActionPayload) =>
      unwrap(await createInvoke<NotificationActionResponse>('notification:action', payload)),
  },
  onNavigate: (callback) => subscribeToEvent<AppNavigatePayload>('app:navigate', callback),
  onNotificationDispatched: (callback) =>
    subscribeToEvent<NotificationDispatchedPayload>('notification:dispatched', callback),
  onNotificationStateChanged: (callback) =>
    subscribeToEvent<NotificationStateChangedPayload>('notification:state-changed', callback),
  onNotificationAcknowledged: (callback) =>
    subscribeToEvent<NotificationAcknowledgedPayload>('notification:acknowledged', callback),
  onScheduleBlockChanged: (callback) =>
    subscribeToEvent<ScheduleBlockChangedPayload>('schedule:block-changed', callback),
}

contextBridge.exposeInMainWorld('focusOS', focusOSApi)
