import type { BrowserWindow } from 'electron'
import type { ChatAssistantMessagePayload } from '@shared/types/ipc'

let mainWindow: BrowserWindow | null = null

export function setChatAssistantWindow(window: BrowserWindow | null): void {
  mainWindow = window
}

export function emitAssistantMessage(payload: ChatAssistantMessagePayload): void {
  if (!mainWindow) {
    return
  }

  mainWindow.webContents.send('chat:assistant-message', payload)
}
