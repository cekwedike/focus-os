import { app, Menu, Tray, nativeImage, type BrowserWindow } from 'electron'
import { setAppQuitting } from '../appState'
import { resolveAppIconPath } from '../utils/appIcon'

let tray: Tray | null = null

export function createTray(getMainWindow: () => BrowserWindow | null): Tray {
  if (tray) {
    return tray
  }

  const iconPath = resolveAppIconPath()
  const icon = iconPath ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty()
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('Focus OS')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Focus OS',
      click: () => {
        const window = getMainWindow()
        if (window) {
          window.show()
          window.focus()
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        setAppQuitting(true)
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    const window = getMainWindow()
    if (window) {
      window.show()
      window.focus()
    }
  })

  return tray
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
