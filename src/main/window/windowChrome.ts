import type { BrowserWindow } from 'electron'
import { attachContextMenu } from '../menus/contextMenu'
import { attachZoomShortcuts } from './zoomShortcuts'

export function configureWindowChrome(window: BrowserWindow): void {
  attachZoomShortcuts(window.webContents)
  attachContextMenu(window)
}
