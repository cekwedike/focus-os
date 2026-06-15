import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type { AppSettingsUpdate, SetOpenRouterKeyPayload } from '@shared/types/settings'
import { getDatabase } from '../db/connection'
import { getAllSettings, upsertSettings } from '../db/repositories/appSettingsRepository'
import { testAiProviders } from '../services/aiService'
import { applyLaunchAtLogin } from '../services/loginItemService'
import {
  clearOpenRouterApiKey,
  isOpenRouterKeyConfigured,
  setOpenRouterApiKey,
} from '../services/secretsService'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', async () => {
    try {
      return success({
        settings: getAllSettings(getDatabase()),
        openrouterKeyConfigured: isOpenRouterKeyConfigured(),
      })
    } catch (error) {
      return failure('SETTINGS_GET_FAILED', String(error))
    }
  })

  ipcMain.handle('settings:update', async (_event, payload: AppSettingsUpdate) => {
    try {
      const settings = upsertSettings(getDatabase(), payload)
      if (payload.launchAtLogin !== undefined) {
        applyLaunchAtLogin(settings.launchAtLogin)
      }
      return success({
        settings,
        openrouterKeyConfigured: isOpenRouterKeyConfigured(),
      })
    } catch (error) {
      return failure('SETTINGS_UPDATE_FAILED', String(error))
    }
  })

  ipcMain.handle('settings:openrouter-key-status', async () => {
    try {
      return success({ configured: isOpenRouterKeyConfigured() })
    } catch (error) {
      return failure('OPENROUTER_KEY_STATUS_FAILED', String(error))
    }
  })

  ipcMain.handle('settings:set-openrouter-key', async (_event, payload: SetOpenRouterKeyPayload) => {
    try {
      if (!payload.apiKey?.trim()) {
        return failure('VALIDATION_ERROR', 'API key is required')
      }
      setOpenRouterApiKey(payload.apiKey)
      return success({ configured: true })
    } catch (error) {
      return failure('OPENROUTER_KEY_SET_FAILED', String(error))
    }
  })

  ipcMain.handle('settings:clear-openrouter-key', async () => {
    try {
      clearOpenRouterApiKey()
      return success({ configured: isOpenRouterKeyConfigured() })
    } catch (error) {
      return failure('OPENROUTER_KEY_CLEAR_FAILED', String(error))
    }
  })

  ipcMain.handle('settings:test-ai-providers', async () => {
    try {
      return success(await testAiProviders(getAllSettings(getDatabase())))
    } catch (error) {
      return failure('SETTINGS_TEST_AI_FAILED', String(error))
    }
  })
}
