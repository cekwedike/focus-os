import type { WebContents } from 'electron'

export function attachReloadShortcuts(webContents: WebContents): void {
  webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') {
      return
    }

    if (input.key !== 'F5' || input.control || input.meta || input.alt) {
      return
    }

    event.preventDefault()
    webContents.reload()
  })
}
