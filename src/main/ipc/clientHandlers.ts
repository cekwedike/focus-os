import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type {
  CreateClientProjectInput,
  CreateProtectedBlockInput,
  UpdateClientProjectInput,
  UpdateProtectedBlockInput,
} from '@shared/types/db'
import { getDatabase, getDatabaseHealth } from '../db/connection'
import {
  createClient,
  deleteClient,
  getClientById,
  listClients,
  updateClient,
} from '../db/repositories/clientsRepository'
import {
  createProtectedBlock,
  deleteProtectedBlock,
  getProtectedBlockById,
  listProtectedBlocks,
  updateProtectedBlock,
} from '../db/repositories/protectedBlocksRepository'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerClientHandlers(): void {
  ipcMain.handle('clients:list', async () => {
    try {
      return success(listClients(getDatabase()))
    } catch (error) {
      return failure('CLIENTS_LIST_FAILED', String(error))
    }
  })

  ipcMain.handle('clients:get', async (_event, payload: { id: number }) => {
    try {
      const client = getClientById(getDatabase(), payload.id)
      if (!client) {
        return failure('CLIENT_NOT_FOUND', `Client ${payload.id} not found`)
      }
      return success(client)
    } catch (error) {
      return failure('CLIENT_GET_FAILED', String(error))
    }
  })

  ipcMain.handle('clients:create', async (_event, payload: CreateClientProjectInput) => {
    try {
      if (!payload.name?.trim()) {
        return failure('VALIDATION_ERROR', 'Client name is required')
      }
      if (!payload.color?.trim()) {
        return failure('VALIDATION_ERROR', 'Client color is required')
      }
      return success(createClient(getDatabase(), payload))
    } catch (error) {
      return failure('CLIENT_CREATE_FAILED', String(error))
    }
  })

  ipcMain.handle('clients:update', async (_event, payload: UpdateClientProjectInput) => {
    try {
      const updated = updateClient(getDatabase(), payload)
      if (!updated) {
        return failure('CLIENT_NOT_FOUND', `Client ${payload.id} not found`)
      }
      return success(updated)
    } catch (error) {
      return failure('CLIENT_UPDATE_FAILED', String(error))
    }
  })

  ipcMain.handle('clients:delete', async (_event, payload: { id: number }) => {
    try {
      const deleted = deleteClient(getDatabase(), payload.id)
      if (!deleted) {
        return failure('CLIENT_NOT_FOUND', `Client ${payload.id} not found`)
      }
      return success({ deleted: true })
    } catch (error) {
      return failure('CLIENT_DELETE_FAILED', String(error))
    }
  })
}

export function registerProtectedBlockHandlers(): void {
  ipcMain.handle('protected-blocks:list', async () => {
    try {
      return success(listProtectedBlocks(getDatabase()))
    } catch (error) {
      return failure('PROTECTED_BLOCKS_LIST_FAILED', String(error))
    }
  })

  ipcMain.handle('protected-blocks:get', async (_event, payload: { id: number }) => {
    try {
      const block = getProtectedBlockById(getDatabase(), payload.id)
      if (!block) {
        return failure('PROTECTED_BLOCK_NOT_FOUND', `Protected block ${payload.id} not found`)
      }
      return success(block)
    } catch (error) {
      return failure('PROTECTED_BLOCK_GET_FAILED', String(error))
    }
  })

  ipcMain.handle('protected-blocks:create', async (_event, payload: CreateProtectedBlockInput) => {
    try {
      if (!payload.label?.trim()) {
        return failure('VALIDATION_ERROR', 'Protected block label is required')
      }
      return success(createProtectedBlock(getDatabase(), payload))
    } catch (error) {
      return failure('PROTECTED_BLOCK_CREATE_FAILED', String(error))
    }
  })

  ipcMain.handle(
    'protected-blocks:update',
    async (_event, payload: UpdateProtectedBlockInput) => {
      try {
        const updated = updateProtectedBlock(getDatabase(), payload)
        if (!updated) {
          return failure('PROTECTED_BLOCK_NOT_FOUND', `Protected block ${payload.id} not found`)
        }
        return success(updated)
      } catch (error) {
        return failure('PROTECTED_BLOCK_UPDATE_FAILED', String(error))
      }
    }
  )

  ipcMain.handle('protected-blocks:delete', async (_event, payload: { id: number }) => {
    try {
      const deleted = deleteProtectedBlock(getDatabase(), payload.id)
      if (!deleted) {
        return failure('PROTECTED_BLOCK_NOT_FOUND', `Protected block ${payload.id} not found`)
      }
      return success({ deleted: true })
    } catch (error) {
      return failure('PROTECTED_BLOCK_DELETE_FAILED', String(error))
    }
  })
}

export function registerDatabaseHandlers(): void {
  ipcMain.handle('db:health', async () => {
    try {
      return success(getDatabaseHealth())
    } catch (error) {
      return failure('DB_HEALTH_FAILED', String(error))
    }
  })
}
