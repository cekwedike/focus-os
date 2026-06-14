import type { DailyScheduleRow } from '@shared/types/db'

const WORK_BLOCK_TYPES = new Set(['fixed_client', 'weighted_client'])
const EXCLUDED_STATUSES = new Set(['superseded', 'skipped'])

export function calculateFocusScore(blocks: DailyScheduleRow[]): number | null {
  const workBlocks = blocks.filter(
    (block) =>
      WORK_BLOCK_TYPES.has(block.block_type) && !EXCLUDED_STATUSES.has(block.status)
  )

  if (workBlocks.length === 0) {
    return null
  }

  const completed = workBlocks.filter((block) => block.status === 'completed').length
  return Math.round((completed / workBlocks.length) * 100)
}
