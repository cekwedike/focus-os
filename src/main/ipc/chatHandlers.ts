import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type { ChatAiFallbackPayload, ChatAiFallbackResult } from '@shared/types/chatAi'
import type { RouterContext } from '@shared/chat/routerContext'
import { getDatabase } from '../db/connection'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import { insertChatAiLog } from '../db/repositories/chatAiLogRepository'
import { buildDailySnapshot } from '../insights/buildDailySnapshot'
import {
  resolveActionTaken,
  resolveChatAiFallback,
  resolveClassifiedIntent,
} from '../services/chatAiService'

export function registerChatHandlers(): void {
  ipcMain.handle(
    'chat:ai-fallback',
    async (
      _event,
      payload: ChatAiFallbackPayload & { routerContext: RouterContext }
    ): Promise<IpcResult<ChatAiFallbackResult>> => {
      try {
        const db = getDatabase()
        const settings = getAllSettings(db)
        const snapshot = buildDailySnapshot(db, payload.scheduleDate)
        const snapshotJson = JSON.stringify(snapshot)

        const result = await resolveChatAiFallback({
          payload,
          settings,
          snapshotJson,
          routerContext: payload.routerContext,
        })

        const chainFailed = result.response.mode === 'unavailable' && result.source === 'none'
        const responseMode = chainFailed ? 'chain_failed' : result.response.mode

        const logRow = insertChatAiLog(db, {
          userMessage: payload.userMessage,
          responseMode,
          classifiedIntent: resolveClassifiedIntent(result.response),
          source: result.source,
          model: result.model,
          actionTaken: resolveActionTaken(result.response),
          generationMs: result.generationMs,
          errorMessage: result.errorMessage,
        })

        return {
          ok: true,
          data: {
            ...result,
            logId: logRow.id,
          },
        }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'CHAT_AI_FALLBACK_FAILED',
            message: String(error),
          },
        }
      }
    }
  )
}
