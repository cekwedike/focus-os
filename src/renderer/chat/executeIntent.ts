import type { ChatAttachment } from '@shared/types/chat'
import type { IntentMatch } from '@shared/chat/routerContext'
import type {
  AddTaskExtracted,
  AcknowledgeCheckInExtracted,
  BlockActionExtracted,
  CompleteTaskExtracted,
  DeleteTaskExtracted,
  UpdateTaskExtracted,
  FaithLogExtracted,
  LongBreakExtracted,
  RouterBlockSummary,
  WakeTimeExtracted,
} from '@shared/chat/routerContext'
import {
  blockStarted,
  checkInAcknowledged,
  endBreakAcknowledged,
  faithLogSaved,
  faithStreakSummary,
  longBreakStarted,
  noActiveBlockToComplete,
  queryStatusSummary,
  replanDayPrompt,
  replanSummaryText,
  scheduleOverview,
  taskAdded,
  taskCompleted,
  taskDeleted,
  taskUpdated,
  taskListIntro,
  wakeTimeConfirmedSummary,
} from '@shared/chat/responseTemplates'
import { buildFaithStreakCard } from '@shared/chat/attachments/buildFaithStreakCard'
import { buildFocusScoreCard } from '@shared/chat/attachments/buildFocusScoreCard'
import { buildPlannedVsActualCard } from '@shared/chat/attachments/buildPlannedVsActualCard'
import { buildScheduleCard } from '@shared/chat/attachments/buildScheduleCard'
import { buildTaskSummaryCard } from '@shared/chat/attachments/buildTaskSummaryCard'
import type { DailyScheduleRow } from '@shared/types/db'

export interface ConversationPatch {
  pendingPrompt?: 'wake_time' | null
  longBreakActive?: boolean
  longBreakBreakId?: number | null
  longBreakStartedAt?: string | null
  activeFaithBlockId?: number | null
}

export interface IntentExecutionResult {
  content?: string
  attachments?: ChatAttachment[]
  conversationPatch?: ConversationPatch
  skipDelivery?: boolean
}

export interface IntentExecutionDeps {
  today: string
  clients: Array<{ id: number; name: string }>
  unassignedClientId: number
  defaultSleepTime: string
  defaultCapacityMinutes: number
  defaultBufferPercent: number
  conversation: {
    longBreakBreakId: number | null
    longBreakStartedAt: string | null
  }
  nextBlock: DailyScheduleRow | null
  activeBlock: DailyScheduleRow | null
  refresh: () => Promise<void>
  mapBlocks: (blocks: DailyScheduleRow[]) => RouterBlockSummary[]
}

function mapBlocksFromRows(blocks: DailyScheduleRow[]): RouterBlockSummary[] {
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

export async function executeIntent(
  match: IntentMatch,
  deps: IntentExecutionDeps,
  aiReplyText?: string
): Promise<IntentExecutionResult> {
  switch (match.intent) {
    case 'wake_time': {
      const extracted = match.extracted as WakeTimeExtracted
      await window.focusOS.daily.upsert({
        settings_date: deps.today,
        wake_time: extracted.wakeTime,
        sleep_target_time: deps.defaultSleepTime,
        remaining_minutes_at_wake: deps.defaultCapacityMinutes,
        buffer_percent: deps.defaultBufferPercent,
      })

      const preview = await window.focusOS.schedule.generate({
        scheduleDate: deps.today,
        wakeTime: extracted.wakeTime,
        sleepTargetTime: deps.defaultSleepTime,
        bufferPercent: deps.defaultBufferPercent,
        capacityMinutes: deps.defaultCapacityMinutes,
      })

      const committed = await window.focusOS.schedule.commit({
        scheduleDate: deps.today,
        settings: {
          settings_date: deps.today,
          wake_time: extracted.wakeTime,
          sleep_target_time: deps.defaultSleepTime,
          buffer_percent: deps.defaultBufferPercent,
          remaining_minutes_at_wake: deps.defaultCapacityMinutes,
        },
        blocks: preview.blocks,
      })

      await deps.refresh()
      const blocks = mapBlocksFromRows(committed.blocks)

      return {
        content: aiReplyText ?? wakeTimeConfirmedSummary(extracted.wakeTime, blocks),
        attachments: [buildScheduleCard(blocks)],
        conversationPatch: { pendingPrompt: null },
      }
    }
    case 'add_task': {
      const extracted = match.extracted as AddTaskExtracted
      const { parseResult } = extracted
      const created = await window.focusOS.tasks.create({
        client_id: parseResult.clientId ?? deps.unassignedClientId,
        title: parseResult.title,
        priority: parseResult.priority,
        deadline_date: parseResult.deadlineDate,
        estimated_minutes: parseResult.estimatedMinutes,
      })
      const clientName =
        deps.clients.find((client) => client.id === created.client_id)?.name ?? 'Unassigned'

      return {
        content: aiReplyText ?? taskAdded(created.title, clientName),
        attachments: [
          buildTaskSummaryCard([
            {
              id: created.id,
              title: created.title,
              client_name: clientName,
              priority: created.priority,
              deadline_date: created.deadline_date,
              status: created.status,
            },
          ]),
        ],
      }
    }
    case 'start_block': {
      const extracted = match.extracted as BlockActionExtracted
      await window.focusOS.schedule.startBlock({ blockId: extracted.blockId })
      await deps.refresh()
      return {
        content: aiReplyText ?? blockStarted(extracted.title),
      }
    }
    case 'complete_block': {
      const extracted = match.extracted as BlockActionExtracted | undefined
      if (!extracted) {
        return { content: noActiveBlockToComplete() }
      }
      await window.focusOS.schedule.completeAndAdvance({
        blockId: extracted.blockId,
        endTime: extracted.early ? new Date().toISOString() : undefined,
      })
      await deps.refresh()
      return { skipDelivery: true }
    }
    case 'extend_block': {
      const extracted = match.extracted as BlockActionExtracted
      await window.focusOS.schedule.extendBlock({ blockId: extracted.blockId })
      await deps.refresh()
      return { skipDelivery: true }
    }
    case 'skip_block': {
      const extracted = match.extracted as BlockActionExtracted
      try {
        await window.focusOS.schedule.skipBlock({ blockId: extracted.blockId })
        await deps.refresh()
        return { skipDelivery: true }
      } catch {
        return { content: 'That block cannot be skipped.' }
      }
    }
    case 'long_break': {
      const extracted = match.extracted as LongBreakExtracted
      const startedAt = new Date().toISOString()
      const created = await window.focusOS.breaks.create({
        break_date: deps.today,
        break_type: 'long',
        started_at: startedAt,
        reason: extracted.reason,
        duration_minutes: extracted.plannedMinutes,
      })

      return {
        content: aiReplyText ?? longBreakStarted(extracted.reason, extracted.plannedMinutes),
        conversationPatch: {
          longBreakActive: true,
          longBreakBreakId: created.id,
          longBreakStartedAt: startedAt,
        },
      }
    }
    case 'end_break': {
      const endedAt = new Date().toISOString()
      const startedAt = deps.conversation.longBreakStartedAt
      const durationMinutes = startedAt
        ? Math.max(
            1,
            Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000)
          )
        : 30

      if (deps.conversation.longBreakBreakId) {
        await window.focusOS.breaks.update({
          id: deps.conversation.longBreakBreakId,
          ended_at: endedAt,
          duration_minutes: durationMinutes,
        })
      }

      const result = await window.focusOS.schedule.reallocate({
        scheduleDate: deps.today,
        returnTime: endedAt,
        longBreakDurationMinutes: durationMinutes,
      })

      await deps.refresh()

      return {
        content: aiReplyText ?? `${endBreakAcknowledged()}\n\n${replanSummaryText(result.replanSummary)}`,
        conversationPatch: {
          longBreakActive: false,
          longBreakBreakId: null,
          longBreakStartedAt: null,
        },
      }
    }
    case 'faith_log': {
      const extracted = match.extracted as FaithLogExtracted
      if (extracted.blockId && extracted.bibleReference) {
        await window.focusOS.journal.completeFaithBlock({
          blockId: extracted.blockId,
          bible_reference: extracted.bibleReference,
          prayer_notes: extracted.prayerNotes ?? null,
        })
        await deps.refresh()
        return {
          content: aiReplyText ?? faithLogSaved(extracted.bibleReference),
        }
      }

      if (extracted.bibleReference) {
        await window.focusOS.journal.upsert({
          entry_date: deps.today,
          bible_reference: extracted.bibleReference,
          prayer_notes: extracted.prayerNotes ?? null,
        })
        await deps.refresh()
        return {
          content: aiReplyText ?? faithLogSaved(extracted.bibleReference),
        }
      }

      if (extracted.prayerNotes) {
        await window.focusOS.journal.upsert({
          entry_date: deps.today,
          bible_reference: 'Prayer notes',
          prayer_notes: extracted.prayerNotes,
        })
        await deps.refresh()
        return {
          content: aiReplyText ?? `Logged prayer notes: ${extracted.prayerNotes}`,
        }
      }

      return { content: 'Please include a Bible reference or prayer notes.' }
    }
    case 'query_schedule': {
      const bundle = await window.focusOS.schedule.getDay({ date: deps.today })
      const blocks = mapBlocksFromRows(bundle.blocks)
      const upcoming =
        deps.nextBlock ?? bundle.blocks.find((block) => block.status === 'planned') ?? null

      return {
        content: aiReplyText ?? scheduleOverview(blocks, upcoming ? mapBlocksFromRows([upcoming])[0] : null),
        attachments: [
          buildScheduleCard(blocks, { highlightBlockId: upcoming?.id ?? deps.activeBlock?.id ?? null }),
        ],
      }
    }
    case 'query_streak': {
      const stats = await window.focusOS.journal.stats({ today: deps.today })
      const todayEntry = await window.focusOS.journal.getEntry({ date: deps.today })
      const todayLogged = Boolean(todayEntry?.bible_reference?.trim())

      return {
        content: aiReplyText ?? faithStreakSummary(stats.currentStreak, stats.longestStreak),
        attachments: [
          buildFaithStreakCard({
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
            todayLogged,
            entriesThisMonth: stats.entriesThisMonth,
          }),
        ],
      }
    }
    case 'query_status': {
      const bundle = await window.focusOS.schedule.getDay({ date: deps.today })
      const review = await window.focusOS.review.getSummary({
        startDate: deps.today,
        endDate: deps.today,
      })
      const focusCard = buildFocusScoreCard(bundle.blocks, deps.activeBlock)
      const plannedCard = buildPlannedVsActualCard(review.clientGroups, deps.today)

      return {
        content: aiReplyText ?? queryStatusSummary(focusCard.score),
        attachments: [focusCard, plannedCard],
      }
    }
    case 'query_tasks': {
      const tasks = await window.focusOS.tasks.list()
      const openTasks = tasks
        .filter((task) => task.status === 'pending' || task.status === 'in_progress')
        .slice(0, 12)

      return {
        content: aiReplyText ?? taskListIntro(openTasks.length),
        attachments: [
          buildTaskSummaryCard(
            openTasks.map((task) => ({
              id: task.id,
              title: task.title,
              client_name: task.client_name,
              priority: task.priority,
              deadline_date: task.deadline_date,
              status: task.status,
            }))
          ),
        ],
      }
    }
    case 'complete_task': {
      const extracted = match.extracted as CompleteTaskExtracted
      await window.focusOS.tasks.update({
        id: extracted.taskId,
        status: 'completed',
      })

      return {
        content: aiReplyText ?? taskCompleted(extracted.title),
      }
    }
    case 'delete_task': {
      const extracted = match.extracted as DeleteTaskExtracted
      await window.focusOS.tasks.delete({ id: extracted.taskId })

      return {
        content: aiReplyText ?? taskDeleted(extracted.title),
      }
    }
    case 'update_task': {
      const extracted = match.extracted as UpdateTaskExtracted
      await window.focusOS.tasks.update({
        id: extracted.taskId,
        title: extracted.title,
      })

      return {
        content: aiReplyText ?? taskUpdated(extracted.previousTitle, extracted.title),
      }
    }
    case 'acknowledge_check_in': {
      const extracted = match.extracted as AcknowledgeCheckInExtracted
      await window.focusOS.checkIns.acknowledge({ clientId: extracted.clientId })
      return {
        content: aiReplyText ?? checkInAcknowledged(extracted.clientName),
      }
    }
    case 'replan_day': {
      return {
        content: replanDayPrompt(),
      }
    }
    default:
      return {}
  }
}
