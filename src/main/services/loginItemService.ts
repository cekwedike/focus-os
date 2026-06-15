import { app } from 'electron'

export function applyLaunchAtLogin(enabled: boolean): void {
  if (process.platform !== 'win32' && process.platform !== 'darwin' && process.platform !== 'linux') {
    return
  }

  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath,
    args: process.platform === 'win32' ? [] : undefined,
  })
}

export function syncLaunchAtLoginFromSettings(enabled: boolean): void {
  applyLaunchAtLogin(enabled)
}
