import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type { VoiceTranscribePayload, VoiceTranscribeResponse } from '@shared/types/voice'
import { callOpenRouterTranscription } from '../ai/transcriptionProvider'
import { getOpenRouterApiKeyForMainProcess, isOpenRouterKeyConfigured } from '../services/secretsService'

function failure<T>(code: string, message: string): IpcResult<T> {
  return { ok: false, error: { code, message } }
}

export function registerVoiceHandlers(): void {
  ipcMain.handle(
    'voice:transcribe',
    async (_event, payload: VoiceTranscribePayload): Promise<IpcResult<VoiceTranscribeResponse>> => {
      try {
        if (!payload?.audioBase64?.trim()) {
          return failure('VOICE_EMPTY_AUDIO', 'No audio was captured')
        }

        if (!payload.format?.trim()) {
          return failure('VOICE_INVALID_FORMAT', 'Audio format is required')
        }

        if (!isOpenRouterKeyConfigured()) {
          return failure(
            'VOICE_NO_API_KEY',
            'OpenRouter API key is required for voice input in Focus OS'
          )
        }

        const apiKey = getOpenRouterApiKeyForMainProcess()
        if (!apiKey) {
          return failure(
            'VOICE_NO_API_KEY',
            'OpenRouter API key is required for voice input in Focus OS'
          )
        }

        const result = await callOpenRouterTranscription({
          apiKey,
          audioBase64: payload.audioBase64,
          format: payload.format,
        })

        return {
          ok: true,
          data: {
            text: result.text,
            model: result.model,
          },
        }
      } catch (error) {
        return failure('VOICE_TRANSCRIBE_FAILED', String(error))
      }
    }
  )
}
