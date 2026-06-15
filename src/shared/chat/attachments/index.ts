import type { ChatAttachment, ChatAttachmentType } from '@shared/types/chat'
import type { RouterBlockSummary } from '../routerContext'
import { buildFaithStreakCard } from './buildFaithStreakCard'
import { buildFocusScoreCard } from './buildFocusScoreCard'
import { buildPlannedVsActualCard } from './buildPlannedVsActualCard'
import { buildScheduleCard } from './buildScheduleCard'
import { buildTaskSummaryCard } from './buildTaskSummaryCard'
import type { DailyScheduleRow } from '@shared/types/db'
import type { PlannedActualGroup } from '@shared/types/review'
import type { TaskRowForCard } from './buildTaskSummaryCard'

export interface AttachmentBuildContext {
  today: string
  blocks?: RouterBlockSummary[]
  highlightBlockId?: number | null
  tasks?: TaskRowForCard[]
  faithStats?: {
    currentStreak: number
    longestStreak: number
    todayLogged: boolean
    entriesThisMonth?: number
  }
  scheduleRows?: DailyScheduleRow[]
  activeBlock?: DailyScheduleRow | null
  plannedActualGroups?: PlannedActualGroup[]
}

export async function buildAttachmentByType(
  type: ChatAttachmentType,
  context: AttachmentBuildContext
): Promise<ChatAttachment | null> {
  switch (type) {
    case 'schedule_card':
      if (!context.blocks) {
        return null
      }
      return buildScheduleCard(context.blocks, {
        highlightBlockId: context.highlightBlockId,
      })
    case 'task_summary_card':
      if (!context.tasks) {
        return null
      }
      return buildTaskSummaryCard(context.tasks)
    case 'faith_streak_card':
      if (!context.faithStats) {
        return null
      }
      return buildFaithStreakCard(context.faithStats)
    case 'focus_score_card':
      if (!context.scheduleRows) {
        return null
      }
      return buildFocusScoreCard(context.scheduleRows, context.activeBlock)
    case 'planned_vs_actual_card':
      if (!context.plannedActualGroups) {
        return null
      }
      return buildPlannedVsActualCard(context.plannedActualGroups, context.today)
    default:
      return null
  }
}
