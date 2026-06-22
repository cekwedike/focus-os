import { useState } from 'react'
import type { DayTimelineCardAttachment } from '@shared/types/chat'
import { ScheduleCardAttachmentView } from './ScheduleCardAttachment'

interface DayTimelineCardAttachmentViewProps {
  attachment: DayTimelineCardAttachment
}

export function DayTimelineCardAttachmentView({
  attachment,
}: DayTimelineCardAttachmentViewProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="text-xs text-accent-mint hover:underline"
        onClick={() => setExpanded((open) => !open)}
      >
        {expanded ? 'Hide today\'s plan' : 'Show today\'s plan'}
      </button>
      {expanded ? (
        <ScheduleCardAttachmentView
          attachment={{
            type: 'schedule_card',
            blocks: attachment.blocks,
            highlightBlockId: null,
          }}
        />
      ) : null}
    </div>
  )
}
