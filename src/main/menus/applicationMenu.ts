import { BrowserWindow, Menu, app, type MenuItemConstructorOptions } from 'electron'
import { APP_NAV_ITEMS } from './navigationItems'

export function setApplicationMenu(): void {
  const viewSubmenu: MenuItemConstructorOptions[] = []

  if (!app.isPackaged) {
    viewSubmenu.push(
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' }
    )
  }

  viewSubmenu.push(
    { role: 'resetZoom' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  )

  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? [{ role: 'appMenu' as const }]
      : [
          {
            label: 'File',
            submenu: [{ role: 'quit' as const }],
          },
        ]),
    { role: 'editMenu' },
    { label: 'View', submenu: viewSubmenu },
    {
      label: 'Go To',
      submenu: APP_NAV_ITEMS.map((item) => ({
        label: item.label,
        accelerator: item.accelerator,
        click: (_menuItem, browserWindow) => {
          if (browserWindow instanceof BrowserWindow) {
            browserWindow.webContents.send('app:navigate', { path: item.path })
          }
        },
      })),
    },
    ...(process.platform === 'darwin' ? [{ role: 'windowMenu' as const }] : []),
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
