import { useCallback, useEffect, useMemo, useState } from 'react'
import { classifyIntent, shouldInvokeIpc } from '@shared/chat/intentRouter'
import { shouldTriggerAiFallback } from '@shared/chat/aiFallback'
import {
  createDefaultConversationState,
  type RouterBlockSummary,
  type RouterContext,
} from '@shared/chat/routerContext'
import { menuList, unrecognized } from '@shared/chat/responseTemplates'
import { CHAT_SCREEN_LINKS } from '@shared/chat/routerContext'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { getTodayDateString } from '@renderer/utils/date'
import { executeIntent, type ConversationPatch } from '@renderer/chat/executeIntent'
import type { AssistantDeliveryInput } from '@shared/chat/assistantDelivery'
import { buildAttachmentByType } from '@shared/chat/attachments'
import type { ChatAttachmentType } from '@shared/types/chat'
import type { ChatRouterContextSummary } from '@shared/types/chatAi'

interface ExtendedConversationState {
  pendingPrompt: 'wake_time' | null
  longBreakActive: boolean
  activeFaithBlockId: number | null
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

function buildRouterContextSummary(context: RouterContext): ChatRouterContextSummary {
  return {
    today: context.today,
    pendingPrompt: context.conversation.pendingPrompt,
    longBreakActive: context.conversation.longBreakActive,
    activeFaithBlockId: context.conversation.activeFaithBlockId,
    activeBlockId: context.activeBlockId,
    clients: context.clients,
    todayBlocks: context.todayBlocks,
    dueCheckInClients: context.dueCheckInClients,
  }
}

interface UseChatOrchestratorOptions {
  deliverAssistantMessage: (input: AssistantDeliveryInput) => Promise<void>
  setAiThinking: (thinking: boolean) => void
}

export function useChatOrchestrator({
  deliverAssistantMessage,
  setAiThinking,
}: UseChatOrchestratorOptions) {
  const { dayBundle, activeBlock, nextBlock, refresh } = useScheduleContext()
  const [conversation, setConversation] = useState<ExtendedConversationState>(
    createExtendedConversationState
  )
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([])
  const [openTasks, setOpenTasks] = useState<Array<{ id: number; title: string }>>([])
  const [unassignedClientId, setUnassignedClientId] = useState(0)
  const [defaultSleepTime, setDefaultSleepTime] = useState('22:00')
  const [defaultCapacityMinutes, setDefaultCapacityMinutes] = useState(480)
  const [defaultBufferPercent, setDefaultBufferPercent] = useState(10)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    void (async () => {
      const today = getTodayDateString()
      const [clientRows, daily, settingsResponse, taskRows] = await Promise.all([
        window.focusOS.clients.list(),
        window.focusOS.daily.get({ date: today }),
        window.focusOS.settings.get(),
        window.focusOS.tasks.list(),
      ])

      const unassigned = clientRows.find((client) => isSystemUnassignedClient(client.name))
      setUnassignedClientId(unassigned?.id ?? 0)
      setClients(
        clientRows
          .filter((client) => !isSystemUnassignedClient(client.name))
          .map((client) => ({ id: client.id, name: client.name }))
      )
      setOpenTasks(
        taskRows
          .filter((task) => task.status === 'pending' || task.status === 'in_progress')
          .map((task) => ({ id: task.id, title: task.title }))
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

  const applyConversationPatch = useCallback((patch: ConversationPatch | undefined): void => {
    if (!patch) {
      return
    }

    setConversation((current) => ({
      ...current,
      ...patch,
    }))
  }, [])

  const routerContextBase: Omit<RouterContext, 'dueCheckInClients'> = useMemo(
    () => ({
      today: getTodayDateString(),
      conversation: {
        pendingPrompt: conversation.pendingPrompt,
        longBreakActive: conversation.longBreakActive,
        activeFaithBlockId: conversation.activeFaithBlockId,
      },
      clients,
      openTasks,
      todayBlocks: mapBlocks(dayBundle?.blocks ?? []),
      activeBlockId: activeBlock?.id ?? null,
      unassignedClientId,
      defaultSleepTime,
      defaultCapacityMinutes,
      defaultBufferPercent,
      nowIso: new Date().toISOString(),
    }),
    [
      conversation,
      clients,
      openTasks,
      dayBundle,
      activeBlock,
      unassignedClientId,
      defaultSleepTime,
      defaultCapacityMinutes,
      defaultBufferPercent,
    ]
  )

  const executionDeps = useMemo(
    () => ({
      today: getTodayDateString(),
      clients,
      unassignedClientId,
      defaultSleepTime,
      defaultCapacityMinutes,
      defaultBufferPercent,
      conversation: {
        longBreakBreakId: conversation.longBreakBreakId,
        longBreakStartedAt: conversation.longBreakStartedAt,
      },
      nextBlock,
      activeBlock,
      refresh,
      mapBlocks,
    }),
    [
      clients,
      unassignedClientId,
      defaultSleepTime,
      defaultCapacityMinutes,
      defaultBufferPercent,
      conversation.longBreakBreakId,
      conversation.longBreakStartedAt,
      nextBlock,
      activeBlock,
      refresh,
    ]
  )

  const runIntent = useCallback(
    async (match: ReturnType<typeof classifyIntent>, aiReplyText?: string): Promise<void> => {
      const result = await executeIntent(match, executionDeps, aiReplyText)
      applyConversationPatch(result.conversationPatch)

      if (result.skipDelivery) {
        return
      }

      if (result.content) {
        await deliverAssistantMessage({
          content: result.content,
          attachments: result.attachments,
        })
      }
    },
    [applyConversationPatch, deliverAssistantMessage, executionDeps]
  )

  const buildSuggestedAttachment = useCallback(
    async (type: ChatAttachmentType): Promise<Awaited<ReturnType<typeof buildAttachmentByType>>> => {
      const today = getTodayDateString()
      const bundle = await window.focusOS.schedule.getDay({ date: today })
      const stats = await window.focusOS.journal.stats({ today })
      const todayEntry = await window.focusOS.journal.getEntry({ date: today })
      const review = await window.focusOS.review.getSummary({ startDate: today, endDate: today })
      const tasks = await window.focusOS.tasks.list()
      const openTasks = tasks
        .filter((task) => task.status === 'pending' || task.status === 'in_progress')
        .slice(0, 12)

      return buildAttachmentByType(type, {
        today,
        blocks: mapBlocks(bundle.blocks),
        highlightBlockId: activeBlock?.id ?? null,
        tasks: openTasks.map((task) => ({
          id: task.id,
          title: task.title,
          client_name: task.client_name,
          priority: task.priority,
          deadline_date: task.deadline_date,
          status: task.status,
        })),
        faithStats: {
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
          todayLogged: Boolean(todayEntry?.bible_reference?.trim()),
          entriesThisMonth: stats.entriesThisMonth,
        },
        scheduleRows: bundle.blocks,
        activeBlock,
        plannedActualGroups: review.clientGroups,
      })
    },
    [activeBlock]
  )

  const processMessage = useCallback(
    async (input: string): Promise<void> => {
      const dueResponse = await window.focusOS.checkIns.getDue()
      const routerContext: RouterContext = {
        ...routerContextBase,
        dueCheckInClients: dueResponse.due.map((entry) => ({
          id: entry.clientId,
          name: entry.clientName,
        })),
      }

      const match = classifyIntent(input, routerContext)

      if (match.ambiguousMessage) {
        await deliverAssistantMessage(match.ambiguousMessage)
        return
      }

      if (match.intent === 'menu') {
        await deliverAssistantMessage(menuList(CHAT_SCREEN_LINKS))
        return
      }

      if (shouldInvokeIpc(match) || match.intent === 'replan_day') {
        try {
          await runIntent(match)
        } catch (error) {
          await deliverAssistantMessage(`Something went wrong: ${String(error)}`)
        }
        return
      }

      if (!shouldTriggerAiFallback(match)) {
        await deliverAssistantMessage(unrecognized())
        return
      }

      setAiThinking(true)
      try {
        const aiResult = await window.focusOS.chat.aiFallback({
          userMessage: input,
          scheduleDate: routerContext.today,
          routerContextSummary: buildRouterContextSummary(routerContext),
          routerContext,
        })

        const { response } = aiResult

        if (response.mode === 'unavailable') {
          await deliverAssistantMessage({
            content: unrecognized(),
            deliveryMode: 'ai',
          })
          return
        }

        if (response.mode === 'conversational') {
          const attachment = response.suggestedAttachment
            ? await buildSuggestedAttachment(response.suggestedAttachment)
            : undefined

          await deliverAssistantMessage({
            content: response.replyText,
            attachments: attachment ? [attachment] : undefined,
            deliveryMode: 'ai',
          })
          return
        }

        await runIntent(
          {
            intent: response.intent,
            extracted: response.extracted,
            requiresIpc: true,
          },
          response.replyText
        )
      } catch {
        await deliverAssistantMessage({
          content: unrecognized(),
          deliveryMode: 'ai',
        })
      } finally {
        setAiThinking(false)
      }
    },
    [
      routerContextBase,
      deliverAssistantMessage,
      runIntent,
      setAiThinking,
      buildSuggestedAttachment,
    ]
  )

  return {
    initialized,
    processMessage,
    pendingWakePrompt: conversation.pendingPrompt === 'wake_time',
    longBreakActive: conversation.longBreakActive,
  }
}
