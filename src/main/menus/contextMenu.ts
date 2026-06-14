import { BrowserWindow, Menu, shell, type ContextMenuParams, type MenuItemConstructorOptions } from 'electron'
import { APP_NAV_ITEMS } from './navigationItems'

export function attachContextMenu(window: BrowserWindow): void {
  window.webContents.on('context-menu', (_event, params: ContextMenuParams) => {
    const template: MenuItemConstructorOptions[] = []

    if (params.isEditable) {
      template.push(
        { role: 'cut', enabled: params.editFlags.canCut },
        { role: 'copy', enabled: params.editFlags.canCopy },
        { role: 'paste', enabled: params.editFlags.canPaste },
        { type: 'separator' },
        { role: 'selectAll', enabled: params.editFlags.canSelectAll },
        { type: 'separator' }
      )
    } else if (params.selectionText.trim().length > 0) {
      template.push(
        { role: 'copy', enabled: params.editFlags.canCopy },
        { type: 'separator' }
      )
    }

    if (params.linkURL) {
      template.push(
        {
          label: 'Open Link',
          click: () => void shell.openExternal(params.linkURL),
        },
        { type: 'separator' }
      )
    }

    template.push(
      { label: 'Zoom In', role: 'zoomIn' },
      { label: 'Zoom Out', role: 'zoomOut' },
      { label: 'Actual Size', role: 'resetZoom' },
      { type: 'separator' },
      {
        label: 'Go To',
        submenu: APP_NAV_ITEMS.map((item) => ({
          label: item.label,
          accelerator: item.accelerator,
          click: () => {
            window.webContents.send('app:navigate', { path: item.path })
          },
        })),
      },
      { type: 'separator' },
      { role: 'quit' }
    )

    Menu.buildFromTemplate(template).popup({ window })
  })
}
