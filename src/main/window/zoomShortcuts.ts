import type { WebContents } from 'electron'

const ZOOM_STEP = 0.5

function isZoomModifierHeld(input: Electron.Input): boolean {
  return (input.control || input.meta) && !input.alt
}

function isZoomInKey(input: Electron.Input): boolean {
  return (
    input.key === '+' ||
    input.code === 'NumpadAdd' ||
    (input.code === 'Equal' && input.shift)
  )
}

function isZoomOutKey(input: Electron.Input): boolean {
  return input.key === '-' || input.code === 'Minus' || input.code === 'NumpadSubtract'
}

function isResetZoomKey(input: Electron.Input): boolean {
  return input.key === '0' || input.code === 'Digit0' || input.code === 'Numpad0'
}

export function attachZoomShortcuts(webContents: WebContents): void {
  webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !isZoomModifierHeld(input)) {
      return
    }

    if (isZoomInKey(input)) {
      event.preventDefault()
      webContents.setZoomLevel(webContents.getZoomLevel() + ZOOM_STEP)
      return
    }

    if (isZoomOutKey(input)) {
      event.preventDefault()
      webContents.setZoomLevel(webContents.getZoomLevel() - ZOOM_STEP)
      return
    }

    if (isResetZoomKey(input)) {
      event.preventDefault()
      webContents.setZoomLevel(0)
    }
  })
}
