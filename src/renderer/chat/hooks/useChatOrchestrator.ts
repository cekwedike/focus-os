import { useCallback, useEffect, useMemo, useState } from 'react'
import { classifyIntent, shouldInvokeIpc } from '@shared/chat/intentRouter'
import {
  createDefaultConversationState,
  type ConversationState,
  type RouterBlockSummary,
  type RouterContext,
} from '@shared/chat/routerContext'
import {
  blockCompleted,
  blockStarted,
  checkInAcknowledged,
  endBreakAcknowledged,
  faithLogSaved,
  faithStreakSummary,
  longBreakStarted,
  menuList,
  noActiveBlockToComplete,
  replanSummaryText,
  scheduleOverview,
  taskAdded,
  unrecognized,
  wakeTimeConfirmedSummary,
} from '@shared/chat/responseTemplates'
import { CHAT_SCREEN_LINKS } from '@shared/chat/routerContext'
import type {
  AddTaskExtracted,
  BlockActionExtracted,
  FaithLogExtracted,
  LongBreakExtracted,
  WakeTimeExtracted,
  AcknowledgeCheckInExtracted,
} from '@shared/chat/routerContext'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useCheckInDue } from '@renderer/context/CheckInDueContext'
import { getTodayDateString } from '@renderer/utils/date'

interface ExtendedConversationState extends ConversationState {
  longBreakBreakId: number | null
  longBreakStartedAt: string | null
}

function createExtendedConversationState(): ExtendedConversationState {
  return {
    ...createDefaultConversationState(),
    longBreakBreakId: null,
    longBreakStartedAt: null,
  }
}

function mapBlocks(
  blocks: Array<{
    id: number
    title: string
    status: string
    block_type: string
    protected_subtype: string | null
    planned_start: string
    planned_end: string
  }>
): RouterBlockSummary[] {
  return blocks.map((block) => ({
    id: block.id,
    title: block.title,
    status: block.status,
    block_type: block.block_type,
    protected_subtype: block.protected_subtype,
    planned_start: block.planned_start,
    planned_end: block.planned_end,
  }))
}

interface UseChatOrchestratorOptions {
  deliverAssistantMessage: (content: string) => Promise<void>
}

export function useChatOrchestrator({
  deliverAssistantMessage,
}: UseChatOrchestratorOptions) {
  const { dayBundle, activeBlock, nextBlock, refresh } = useScheduleContext()
  const { dueEntries, acknowledge: acknowledgeCheckIn } = useCheckInDue()
  const [conversation, setConversation] = useState<ExtendedConversationState>(
    createExtendedConversationState
  )
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([])
  const [unassignedClientId, setUnassignedClientId] = useState(0)
  const [defaultSleepTime, setDefaultSleepTime] = useState('22:00')
  const [defaultCapacityMinutes, setDefaultCapacityMinutes] = useState(480)
  const [defaultBufferPercent, setDefaultBufferPercent] = useState(10)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    void (async () => {
      const today = getTodayDateString()
      const [clientRows, daily, settingsResponse] = await Promise.all([
        window.focusOS.clients.list(),
        window.focusOS.daily.get({ date: today }),
        window.focusOS.settings.get(),
      ])

      const unassigned = clientRows.find((client) => isSystemUnassignedClient(client.name))
      setUnassignedClientId(unassigned?.id ?? 0)
      setClients(
        clientRows
          .filter((client) => !isSystemUnassignedClient(client.name))
          .map((client) => ({ id: client.id, name: client.name }))
      )

      const yesterday = daily.yesterday
      setDefaultSleepTime(
        yesterday?.sleep_target_time ??
          settingsResponse.settings.defaultSleepTime ??
          '22:00'
      )
      setDefaultCapacityMinutes(
        daily.settings?.remaining_minutes_at_wake ??
          yesterday?.remaining_minutes_at_wake ??
          480
      )
      setDefaultBufferPercent(
        daily.settings?.buffer_percent ?? settingsResponse.settings.defaultBufferPercent
      )

      if (!daily.settings?.wake_time) {
        setConversation((current) => ({
          ...current,
          pendingPrompt: 'wake_time',
        }))
      }

      setInitialized(true)
    })()
  }, [])

  const routerContext: RouterContext = useMemo(
    () => ({
      today: getTodayDateString(),
      conversation: {
        pendingPrompt: conversation.pendingPrompt,
        longBreakActive: conversation.longBreakActive,
        activeFaithBlockId: conversation.activeFaithBlockId,
      },
      clients,
      todayBlocks: mapBlocks(dayBundle?.blocks ?? []),
      activeBlockId: activeBlock?.id ?? null,
      unassignedClientId,
      defaultSleepTime,
      defaultCapacityMinutes,
      defaultBufferPercent,
      nowIso: new Date().toISOString(),
      dueCheckInClients: dueEntries.map((entry) => ({
        id: entry.clientId,
        name: entry.clientName,
      })),
    }),
    [
      conversation,
      clients,
      dayBundle,
      activeBlock,
      unassignedClientId,
      defaultSleepTime,
      defaultCapacityMinutes,
      defaultBufferPercent,
      dueEntries,
    ]
  )

  const executeWakeTime = useCallback(
    async (extracted: WakeTimeExtracted): Promise<string> => {
      const today = getTodayDateString()
      await window.focusOS.daily.upsert({
        settings_date: today,
        wake_time: extracted.wakeTime,
        sleep_target_time: defaultSleepTime,
        remaining_minutes_at_wake: defaultCapacityMinutes,
        buffer_percent: defaultBufferPercent,
      })

      const preview = await window.focusOS.schedule.generate({
        scheduleDate: today,
        wakeTime: extracted.wakeTime,
        sleepTargetTime: defaultSleepTime,
        bufferPercent: defaultBufferPercent,
        capacityMinutes: defaultCapacityMinutes,
      })

      const committed = await window.focusOS.schedule.commit({
        scheduleDate: today,
        settings: {
          settings_date: today,
          wake_time: extracted.wakeTime,
          sleep_target_time: defaultSleepTime,
          buffer_percent: defaultBufferPercent,
          remaining_minutes_at_wake: defaultCapacityMinutes,
        },
        blocks: preview.blocks,
      })

      await refresh()
      setConversation((current) => ({
        ...current,
        pendingPrompt: null,
      }))

      return wakeTimeConfirmedSummary(
        extracted.wakeTime,
        mapBlocks(committed.blocks)
      )
    },
    [
      defaultSleepTime,
      defaultCapacityMinutes,
      defaultBufferPercent,
      refresh,
    ]
  )

  const processMessage = useCallback(
    async (input: string): Promise<void> => {
      const match = classifyIntent(input, routerContext)

      if (match.ambiguousMessage) {
        await deliverAssistantMessage(match.ambiguousMessage)
        return
      }

      if (!shouldInvokeIpc(match)) {
        if (match.intent === 'menu') {
          await deliverAssistantMessage(menuList(CHAT_SCREEN_LINKS))
          return
        }
        await deliverAssistantMessage(unrecognized())
        return
      }

      try {
        switch (match.intent) {
          case 'wake_time': {
            const extracted = match.extracted as WakeTimeExtracted
            const response = await executeWakeTime(extracted)
            await deliverAssistantMessage(response)
            break
          }
          case 'add_task': {
            const extracted = match.extracted as AddTaskExtracted
            const { parseResult } = extracted
            const created = await window.focusOS.tasks.create({
              client_id: parseResult.clientId ?? unassignedClientId,
              title: parseResult.title,
              priority: parseResult.priority,
              deadline_date: parseResult.deadlineDate,
              estimated_minutes: parseResult.estimatedMinutes,
            })
            const clientName =
              clients.find((client) => client.id === created.client_id)?.name ?? 'Unassigned'
            await deliverAssistantMessage(taskAdded(created.title, clientName))
            break
          }
          case 'start_block': {
            const extracted = match.extracted as BlockActionExtracted
            await window.focusOS.schedule.startBlock({ blockId: extracted.blockId })
            await refresh()
            await deliverAssistantMessage(blockStarted(extracted.title))
            break
          }
          case 'complete_block': {
            const extracted = match.extracted as BlockActionExtracted | undefined
            if (!extracted) {
              await deliverAssistantMessage(noActiveBlockToComplete())
              break
            }
            await window.focusOS.schedule.completeBlock({ blockId: extracted.blockId })
            await refresh()
            await deliverAssistantMessage(blockCompleted(extracted.title))
            break
          }
          case 'long_break': {
            const extracted = match.extracted as LongBreakExtracted
            const startedAt = new Date().toISOString()
            const created = await window.focusOS.breaks.create({
              break_date: getTodayDateString(),
              break_type: 'long',
              started_at: startedAt,
              reason: extracted.reason,
              duration_minutes: extracted.plannedMinutes,
            })
            setConversation((current) => ({
              ...current,
              longBreakActive: true,
              longBreakBreakId: created.id,
              longBreakStartedAt: startedAt,
            }))
            await deliverAssistantMessage(
              longBreakStarted(extracted.reason, extracted.plannedMinutes)
            )
            break
          }
          case 'end_break': {
            await deliverAssistantMessage(endBreakAcknowledged())
            const endedAt = new Date().toISOString()
            const startedAt = conversation.longBreakStartedAt
            const durationMinutes = startedAt
              ? Math.max(
                  1,
                  Math.round(
                    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000
                  )
                )
              : 30

            if (conversation.longBreakBreakId) {
              await window.focusOS.breaks.update({
                id: conversation.longBreakBreakId,
                ended_at: endedAt,
                duration_minutes: durationMinutes,
              })
            }

            const result = await window.focusOS.schedule.reallocate({
              scheduleDate: getTodayDateString(),
              returnTime: endedAt,
              longBreakDurationMinutes: durationMinutes,
            })

            setConversation((current) => ({
              ...current,
              longBreakActive: false,
              longBreakBreakId: null,
              longBreakStartedAt: null,
            }))
            await refresh()
            await deliverAssistantMessage(replanSummaryText(result.replanSummary))
            break
          }
          case 'faith_log': {
            const extracted = match.extracted as FaithLogExtracted
            const today = getTodayDateString()
            if (extracted.blockId && extracted.bibleReference) {
              await window.focusOS.journal.completeFaithBlock({
                blockId: extracted.blockId,
                bible_reference: extracted.bibleReference,
                prayer_notes: extracted.prayerNotes ?? null,
              })
              await deliverAssistantMessage(faithLogSaved(extracted.bibleReference))
            } else if (extracted.bibleReference) {
              await window.focusOS.journal.upsert({
                entry_date: today,
                bible_reference: extracted.bibleReference,
                prayer_notes: extracted.prayerNotes ?? null,
              })
              await deliverAssistantMessage(faithLogSaved(extracted.bibleReference))
            } else if (extracted.prayerNotes) {
              await window.focusOS.journal.upsert({
                entry_date: today,
                bible_reference: 'Prayer notes',
                prayer_notes: extracted.prayerNotes,
              })
              await deliverAssistantMessage(`Logged prayer notes: ${extracted.prayerNotes}`)
            }
            await refresh()
            break
          }
          case 'query_schedule': {
            const bundle = await window.focusOS.schedule.getDay({ date: getTodayDateString() })
            const blocks = mapBlocks(bundle.blocks)
            const upcoming =
              nextBlock ??
              bundle.blocks.find((block) => block.status === 'planned') ??
              null
            await deliverAssistantMessage(
              scheduleOverview(
                blocks,
                upcoming
                  ? {
                      id: upcoming.id,
                      title: upcoming.title,
                      status: upcoming.status,
                      block_type: upcoming.block_type,
                      protected_subtype: upcoming.protected_subtype,
                      planned_start: upcoming.planned_start,
                      planned_end: upcoming.planned_end,
                    }
                  : null
              )
            )
            break
          }
          case 'query_streak': {
            const stats = await window.focusOS.journal.stats({ today: getTodayDateString() })
            await deliverAssistantMessage(faithStreakSummary(stats.currentStreak, stats.longestStreak))
            break
          }
          case 'acknowledge_check_in': {
            const extracted = match.extracted as AcknowledgeCheckInExtracted
            await acknowledgeCheckIn(extracted.clientId)
            await deliverAssistantMessage(checkInAcknowledged(extracted.clientName))
            break
          }
          default:
            await deliverAssistantMessage(unrecognized())
        }
      } catch (error) {
        await deliverAssistantMessage(`Something went wrong: ${String(error)}`)
      }
    },
    [
      routerContext,
      deliverAssistantMessage,
      executeWakeTime,
      unassignedClientId,
      clients,
      refresh,
      conversation.longBreakBreakId,
      conversation.longBreakStartedAt,
      nextBlock,
      acknowledgeCheckIn,
    ]
  )

  return {
    initialized,
    processMessage,
    pendingWakePrompt: conversation.pendingPrompt === 'wake_time',
    longBreakActive: conversation.longBreakActive,
  }
}
