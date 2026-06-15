import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { closeDatabase, initializeDatabase } from '../../src/main/db/connection'
import {
  getNotificationById,
  listUnacknowledgedNotifications,
} from '../../src/main/db/repositories/notificationsLogRepository'
import {
  getActiveByDedupeKeyForTests,
  notify,
  performNotificationAction,
  resetNotificationServiceForTests,
  setNotificationWindow,
} from '../../src/main/services/notificationService'
import { resetDesktopNotificationTestState } from '../../src/main/services/desktopNotification'
import { getDatabase } from '../../src/main/db/connection'

const desktopShowMock = vi.fn()

vi.mock('electron', () => ({
  Notification: class {
    static isSupported(): boolean {
      return true
    }

    constructor(public options: Record<string, unknown>) {}

    on(): void {
      return undefined
    }

    show(): void {
      desktopShowMock()
    }
  },
  nativeImage: {
    createFromPath: () => undefined,
  },
}))

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'focus-os-notify-test-'))
  return join(directory, 'focus-os.test.db')
}

function createMockWindow(sendMock: ReturnType<typeof vi.fn>) {
  return {
    isDestroyed: () => false,
    isVisible: () => true,
    show: vi.fn(),
    focus: vi.fn(),
    webContents: {
      send: sendMock,
    },
  }
}

describe('notificationService', () => {
  let dbPath = ''
  let sendMock = vi.fn()

  beforeEach(() => {
    dbPath = createTempDatabasePath()
    closeDatabase()
    initializeDatabase(dbPath)
    sendMock = vi.fn()
    resetNotificationServiceForTests()
    resetDesktopNotificationTestState()
    desktopShowMock.mockClear()
    setNotificationWindow(createMockWindow(sendMock) as never)
  })

  afterEach(() => {
    resetNotificationServiceForTests()
    resetDesktopNotificationTestState()
    setNotificationWindow(null)
    closeDatabase()
    if (dbPath) {
      rmSync(join(dbPath, '..'), { recursive: true, force: true })
      dbPath = ''
    }
  })

  it('dispatches non-persistent notifications to desktop and renderer', () => {
    const id = notify({
      type: 'micro_break',
      title: 'Micro-Break Time',
      message: 'Pick a short activity.',
      urgency: 'normal',
      persistent: false,
      dedupeKey: 'micro_break:1',
      actions: [{ id: 'micro_break.read', label: 'Read' }],
    })

    expect(id).toBeGreaterThan(0)
    expect(desktopShowMock).toHaveBeenCalledTimes(1)
    expect(sendMock).toHaveBeenCalledWith(
      'notification:dispatched',
      expect.objectContaining({
        id,
        type: 'micro_break',
        showInChat: true,
        skippedDuplicate: false,
      })
    )
    expect(getActiveByDedupeKeyForTests().size).toBe(0)
  })

  it('registers persistent notifications in the active map', () => {
    const id = notify({
      type: 'check_in_due',
      title: 'Check in for Client',
      message: 'Time to check in.',
      urgency: 'high',
      persistent: true,
      dedupeKey: 'check_in:1:2026-06-15',
      actions: [{ id: 'check_in.done', label: 'Done' }],
      metadata: { clientId: 1 },
    })

    expect(getActiveByDedupeKeyForTests().get('check_in:1:2026-06-15')?.id).toBe(id)
    expect(sendMock).toHaveBeenCalledWith(
      'notification:state-changed',
      expect.objectContaining({
        active: expect.arrayContaining([
          expect.objectContaining({ id, type: 'check_in_due' }),
        ]),
      })
    )
  })

  it('does not duplicate desktop or chat dispatch for active persistent notifications', () => {
    const firstId = notify({
      type: 'check_in_due',
      title: 'Check in',
      message: 'Due now',
      urgency: 'high',
      persistent: true,
      dedupeKey: 'check_in:2:2026-06-15',
      actions: [{ id: 'check_in.done', label: 'Done' }],
      metadata: { clientId: 2 },
    })

    desktopShowMock.mockClear()
    sendMock.mockClear()

    const secondId = notify({
      type: 'check_in_due',
      title: 'Check in',
      message: 'Due now',
      urgency: 'high',
      persistent: true,
      dedupeKey: 'check_in:2:2026-06-15',
      actions: [{ id: 'check_in.done', label: 'Done' }],
      metadata: { clientId: 2 },
    })

    expect(secondId).toBe(firstId)
    expect(desktopShowMock).not.toHaveBeenCalled()
    expect(sendMock).toHaveBeenCalledWith(
      'notification:dispatched',
      expect.objectContaining({
        id: firstId,
        skippedDuplicate: true,
        showInChat: false,
      })
    )
  })

  it('writes notifications_log rows and updates acknowledged_at on action', () => {
    const id = notify({
      type: 'staleness_alert',
      title: 'Client Staleness',
      message: 'Client A is stale.',
      urgency: 'normal',
      persistent: false,
      dedupeKey: 'staleness:3:2026-06-15',
      actions: [{ id: 'staleness.got_it', label: 'Got It' }],
    })

    const db = getDatabase()
    const before = getNotificationById(db, id)
    expect(before?.acknowledged_at).toBeNull()

    const result = performNotificationAction(id, 'staleness.got_it')
    expect(result.acknowledged).toBe(true)

    const after = getNotificationById(db, id)
    expect(after?.acknowledged_at).not.toBeNull()
    expect(listUnacknowledgedNotifications(db)).toHaveLength(0)
    expect(
      sendMock.mock.calls.some(([channel]) => channel === 'notification:acknowledged')
    ).toBe(true)
  })

  it('clears persistent banner state when acknowledged via action', () => {
    const id = notify({
      type: 'faith_reminder',
      title: 'Faith Block',
      message: 'Log faith time.',
      urgency: 'normal',
      persistent: true,
      dedupeKey: 'faith_reminder:2026-06-15',
      actions: [{ id: 'faith.got_it', label: 'Got It' }],
    })

    expect(getActiveByDedupeKeyForTests().has('faith_reminder:2026-06-15')).toBe(true)

    performNotificationAction(id, 'faith.got_it')

    expect(getActiveByDedupeKeyForTests().has('faith_reminder:2026-06-15')).toBe(false)
    expect(sendMock).toHaveBeenCalledWith(
      'notification:state-changed',
      expect.objectContaining({ active: [] })
    )
  })
})
