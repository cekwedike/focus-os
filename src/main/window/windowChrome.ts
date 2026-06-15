import type { BrowserWindow } from 'electron'
import { attachContextMenu } from '../menus/contextMenu'
import { attachReloadShortcuts } from './reloadShortcuts'
import { attachZoomShortcuts } from './zoomShortcuts'

export function configureWindowChrome(window: BrowserWindow): void {
  attachReloadShortcuts(window.webContents)
  attachZoomShortcuts(window.webContents)
  attachContextMenu(window)
}
