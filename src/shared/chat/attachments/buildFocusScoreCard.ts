import type { FocusScoreCardAttachment } from '@shared/types/chat'
import type { DailyScheduleRow } from '@shared/types/db'
import { calculateFocusScore } from '@shared/utils/focusScore'

const WORK_BLOCK_TYPES = new Set(['fixed_client', 'weighted_client'])
const EXCLUDED_STATUSES = new Set(['superseded', 'skipped'])

export function buildFocusScoreCard(
  blocks: DailyScheduleRow[],
  activeBlock?: DailyScheduleRow | null
): FocusScoreCardAttachment {
  const workBlocks = blocks.filter(
    (block) =>
      WORK_BLOCK_TYPES.has(block.block_type) && !EXCLUDED_STATUSES.has(block.status)
  )
  const completedBlocks = workBlocks.filter((block) => block.status === 'completed').length
  const score = calculateFocusScore(blocks)

  let activeBlockProgressPercent: number | null = null
  if (
    activeBlock?.planned_start &&
    activeBlock.planned_end &&
    activeBlock.status === 'active'
  ) {
    const start = new Date(activeBlock.planned_start).getTime()
    const end = new Date(activeBlock.planned_end).getTime()
    const now = Date.now()
    const span = end - start
    if (span > 0) {
      activeBlockProgressPercent = Math.min(100, Math.max(0, Math.round(((now - start) / span) * 100)))
    }
  }

  return {
    type: 'focus_score_card',
    score,
    completedBlocks,
    totalWorkBlocks: workBlocks.length,
    activeBlockTitle: activeBlock?.title ?? null,
    activeBlockProgressPercent,
  }
}
