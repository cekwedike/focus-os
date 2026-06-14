import { app, BrowserWindow, shell } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import {
  APP_BACKGROUND_COLOR,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
} from '@shared/constants/app'
import { bootstrapDatabase, registerIpcHandlers } from './ipc'
import { setApplicationMenu } from './menus/applicationMenu'
import { startStalenessService, stopStalenessService } from './services/stalenessService'
import { startTimerService, stopTimerService } from './services/timerService'
import { configureWindowChrome } from './window/windowChrome'

function resolveWindowIcon(): string | undefined {
  const candidates = [
    join(__dirname, '../../resources/icon.png'),
    join(process.resourcesPath, 'icon.png'),
  ]

  return candidates.find((candidate) => existsSync(candidate))
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    show: false,
    backgroundColor: APP_BACKGROUND_COLOR,
    icon: resolveWindowIcon(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    startTimerService(mainWindow)
    startStalenessService(mainWindow)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  configureWindowChrome(mainWindow)

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  bootstrapDatabase()
  registerIpcHandlers()
  setApplicationMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopTimerService()
  stopStalenessService()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
