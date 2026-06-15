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
import { getDatabase } from './db/connection'
import { getAllSettings, upsertSettings } from './db/repositories/appSettingsRepository'
import { isAppQuitting, setAppQuitting } from './appState'
import { startCheckInService, stopCheckInService } from './services/checkInService'
import { syncLaunchAtLoginFromSettings } from './services/loginItemService'
import { showDesktopNotification } from './services/notificationService'
import { startStalenessService, stopStalenessService } from './services/stalenessService'
import { startTimerService, stopTimerService } from './services/timerService'
import { setChatAssistantWindow } from './services/chatAssistantBridge'
import { createTray, destroyTray } from './services/trayService'
import { configureWindowChrome } from './window/windowChrome'

let mainWindow: BrowserWindow | null = null

function resolveWindowIcon(): string | undefined {
  const candidates = [
    join(__dirname, '../../resources/icon.png'),
    join(process.resourcesPath, 'icon.png'),
  ]

  return candidates.find((candidate) => existsSync(candidate))
}

function showTrayCloseTipOnce(): void {
  const db = getDatabase()
  const settings = getAllSettings(db)
  if (settings.trayCloseTipShown) {
    return
  }

  showDesktopNotification({
    title: 'Focus OS is still running',
    body: 'Closing the window keeps Focus OS in the system tray. Right-click the tray icon to quit.',
    category: 'clientReminder',
  })

  upsertSettings(db, { trayCloseTipShown: true })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
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

  mainWindow.on('close', (event) => {
    if (!isAppQuitting()) {
      event.preventDefault()
      mainWindow?.hide()
      showTrayCloseTipOnce()
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    setChatAssistantWindow(mainWindow!)
    startTimerService(mainWindow!)
    startStalenessService(mainWindow!)
    startCheckInService(mainWindow!)
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
  const settings = getAllSettings(getDatabase())
  syncLaunchAtLoginFromSettings(settings.launchAtLogin)
  registerIpcHandlers()
  setApplicationMenu()
  createWindow()
  createTray(() => mainWindow)

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      return
    }
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  setAppQuitting(true)
  stopTimerService()
  stopStalenessService()
  stopCheckInService()
  setChatAssistantWindow(null)
  destroyTray()
})

app.on('window-all-closed', () => {
  if (process.platform === 'darwin' && !isAppQuitting()) {
    return
  }
  if (!isAppQuitting()) {
    return
  }
  app.quit()
})
