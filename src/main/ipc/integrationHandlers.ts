import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type {
  ExternalDaySummary,
  FindMeetingSlotsPayload,
  FindMeetingSlotsResponse,
  GoogleConnectionStatus,
  SuggestedEmailTask,
} from '@shared/types/integrations'
import { getDatabase } from '../db/connection'
import { getAllSettings, upsertSettings } from '../db/repositories/appSettingsRepository'
import {
  deleteExternalAccount,
  getGoogleAccount,
  upsertExternalAccount,
} from '../db/repositories/externalAccountsRepository'
import {
  getEmailMessage,
  linkEmailToTask,
} from '../db/repositories/emailMessagesRepository'
import { createTask, getUnassignedClientId } from '../db/repositories/tasksRepository'
import { listBriefingsForDate } from '../db/repositories/assistantBriefingsRepository'
import { listBlocksForDate } from '../db/repositories/dailyScheduleRepository'
import { listCalendarEventsForDate } from '../db/repositories/calendarEventsRepository'
import { startGoogleOAuthFlow } from '../integrations/google/oauth'
import { listGoogleCalendars } from '../integrations/google/calendarClient'
import {
  clearGoogleTokens,
  isGoogleOAuthConfigured,
} from '../services/secretsService'
import {
  restartGoogleSyncService,
  syncGoogleAccount,
} from '../services/googleSyncService'
import {
  buildExternalDaySummary,
  listSuggestedEmailTasks,
} from '../services/externalSummaryService'
import { findMeetingSlots } from '@shared/availability'
import { parseScheduleDateTime } from '@shared/allocation/timeline'
import { getDailySettings } from '../db/repositories/dailySettingsRepository'

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function buildGoogleStatus(db = getDatabase()): GoogleConnectionStatus {
  const account = getGoogleAccount(db)
  return {
    connected: Boolean(account),
    accountEmail: account?.account_email ?? null,
    gmailEnabled: account ? account.gmail_enabled === 1 : false,
    calendarEnabled: account ? account.calendar_enabled === 1 : false,
    lastSyncAt: account?.last_sync_at ?? null,
    configured: isGoogleOAuthConfigured(),
  }
}

export function registerIntegrationHandlers(): void {
  ipcMain.handle('google:status', async (): Promise<IpcResult<GoogleConnectionStatus>> => {
    return { ok: true, data: buildGoogleStatus() }
  })

  ipcMain.handle('google:connect', async (): Promise<IpcResult<GoogleConnectionStatus>> => {
    try {
      const db = getDatabase()
      const result = await startGoogleOAuthFlow()
      const settings = getAllSettings(db)

      upsertExternalAccount(db, {
        provider: 'google',
        accountEmail: result.accountEmail,
        scopes: result.scopes,
        tokenKeyRef: result.tokenKeyRef,
        calendarIdsJson: JSON.stringify(settings.google.calendarIds),
      })

      await syncGoogleAccount(db)
      restartGoogleSyncService(db)

      return { ok: true, data: buildGoogleStatus(db) }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'GOOGLE_CONNECT_FAILED',
          message: error instanceof Error ? error.message : 'Google connect failed',
        },
      }
    }
  })

  ipcMain.handle('google:disconnect', async (): Promise<IpcResult<GoogleConnectionStatus>> => {
    try {
      const db = getDatabase()
      const account = getGoogleAccount(db)
      if (account) {
        clearGoogleTokens(account.token_key_ref)
        deleteExternalAccount(db, account.id)
      }
      return { ok: true, data: buildGoogleStatus(db) }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'GOOGLE_DISCONNECT_FAILED',
          message: error instanceof Error ? error.message : 'Disconnect failed',
        },
      }
    }
  })

  ipcMain.handle('google:sync', async (): Promise<IpcResult<{ calendarCount: number; emailCount: number }>> => {
    try {
      const db = getDatabase()
      const result = await syncGoogleAccount(db)
      return { ok: true, data: result }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'GOOGLE_SYNC_FAILED',
          message: error instanceof Error ? error.message : 'Sync failed',
        },
      }
    }
  })

  ipcMain.handle(
    'google:list-calendars',
    async (): Promise<IpcResult<Array<{ id: string; summary: string; primary?: boolean }>>> => {
      try {
        const db = getDatabase()
        const account = getGoogleAccount(db)
        if (!account) {
          return { ok: true, data: [] }
        }
        const calendars = await listGoogleCalendars(account.token_key_ref)
        return { ok: true, data: calendars }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'GOOGLE_LIST_CALENDARS_FAILED',
            message: error instanceof Error ? error.message : 'Failed to list calendars',
          },
        }
      }
    }
  )

  ipcMain.handle(
    'integrations:external-summary',
    async (): Promise<IpcResult<ExternalDaySummary>> => {
      const db = getDatabase()
      return { ok: true, data: buildExternalDaySummary(db) }
    }
  )

  ipcMain.handle(
    'integrations:suggested-tasks',
    async (): Promise<IpcResult<SuggestedEmailTask[]>> => {
      const db = getDatabase()
      return { ok: true, data: listSuggestedEmailTasks(db) }
    }
  )

  ipcMain.handle(
    'integrations:accept-email-task',
    async (_event, payload: { emailId: number }): Promise<IpcResult<{ taskId: number }>> => {
      try {
        const db = getDatabase()
        const email = getEmailMessage(db, payload.emailId)
        if (!email) {
          return { ok: false, error: { code: 'NOT_FOUND', message: 'Email not found' } }
        }

        const clientId = email.suggested_client_id ?? getUnassignedClientId(db)
        const task = createTask(db, {
          client_id: clientId,
          title: email.subject.replace(/^(re:|fwd:)\s*/i, '').slice(0, 200),
          priority: email.suggested_priority ?? 2,
          deadline_date: email.suggested_deadline,
          estimated_minutes: 30,
          status: 'pending',
        })

        linkEmailToTask(db, email.id, task.id)
        return { ok: true, data: { taskId: task.id } }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'ACCEPT_EMAIL_TASK_FAILED',
            message: error instanceof Error ? error.message : 'Failed to create task',
          },
        }
      }
    }
  )

  ipcMain.handle(
    'integrations:find-meeting-slots',
    async (_event, payload: FindMeetingSlotsPayload): Promise<IpcResult<FindMeetingSlotsResponse>> => {
      const db = getDatabase()
      const settings = getAllSettings(db)
      const daily = getDailySettings(db, payload.scheduleDate)
      const wakeTime = daily?.wake_time ?? '09:00'
      const sleepTime = daily?.sleep_target_time ?? settings.defaultSleepTime

      const dayStart = parseScheduleDateTime(payload.scheduleDate, wakeTime)
      const dayEnd = parseScheduleDateTime(payload.scheduleDate, sleepTime)

      const format = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
      }

      const slots = findMeetingSlots({
        scheduleDate: payload.scheduleDate,
        durationMinutes: payload.durationMinutes,
        dayStartIso: format(dayStart),
        dayEndIso: format(dayEnd),
        scheduleBlocks: listBlocksForDate(db, payload.scheduleDate),
        calendarEvents: listCalendarEventsForDate(db, payload.scheduleDate),
        preferredStartHour: payload.preferredStartHour,
        preferredEndHour: payload.preferredEndHour,
      })

      return { ok: true, data: { slots } }
    }
  )

  ipcMain.handle(
    'assistant:list-briefings',
    async (_event, payload?: { scheduleDate?: string }): Promise<IpcResult<{ briefings: ReturnType<typeof listBriefingsForDate> }>> => {
      const db = getDatabase()
      const scheduleDate = payload?.scheduleDate ?? todayDateString()
      return { ok: true, data: { briefings: listBriefingsForDate(db, scheduleDate) } }
    }
  )

  ipcMain.handle(
    'onboarding:complete',
    async (): Promise<IpcResult<{ freelancerWizardComplete: boolean }>> => {
      const db = getDatabase()
      upsertSettings(db, { freelancerWizardComplete: true })
      return { ok: true, data: { freelancerWizardComplete: true } }
    }
  )
}
