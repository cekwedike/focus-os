import type { BrowserWindow } from 'electron'

let mainWindow: BrowserWindow | null = null

export function setAppNavigateWindow(window: BrowserWindow | null): void {
  mainWindow = window
}

export function emitAppNavigate(path: string): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  mainWindow.webContents.send('app:navigate', { path })
}
