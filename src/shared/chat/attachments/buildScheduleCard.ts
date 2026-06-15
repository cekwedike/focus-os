import type { ScheduleCardAttachment, ScheduleCardBlock } from '@shared/types/chat'
import type { RouterBlockSummary } from '../routerContext'

export function buildScheduleCard(
  blocks: RouterBlockSummary[],
  options?: {
    clientColors?: Map<number, string>
    highlightBlockId?: number | null
  }
): ScheduleCardAttachment {
  const cardBlocks: ScheduleCardBlock[] = blocks.map((block) => ({
    id: block.id,
    title: block.title,
    status: block.status,
    block_type: block.block_type,
    clientColor: options?.clientColors?.get(block.id) ?? null,
    planned_start: block.planned_start,
    planned_end: block.planned_end,
  }))

  return {
    type: 'schedule_card',
    blocks: cardBlocks,
    highlightBlockId: options?.highlightBlockId ?? null,
  }
}
