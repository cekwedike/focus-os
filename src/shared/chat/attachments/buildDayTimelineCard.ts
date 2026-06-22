import type { DayTimelineCardAttachment } from '@shared/types/chat'
import type { RouterBlockSummary } from '../routerContext'

export function buildDayTimelineCard(blocks: RouterBlockSummary[]): DayTimelineCardAttachment {
  return {
    type: 'day_timeline_card',
    blocks: blocks.map((block) => ({
      id: block.id,
      title: block.title,
      status: block.status,
      block_type: block.block_type,
      clientColor: null,
      planned_start: block.planned_start,
      planned_end: block.planned_end,
    })),
  }
}
