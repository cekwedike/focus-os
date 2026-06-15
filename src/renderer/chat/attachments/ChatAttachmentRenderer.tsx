import type { ChatAttachment } from '@shared/types/chat'
import { ScheduleCardAttachmentView } from './ScheduleCardAttachment'
import { TaskSummaryCardAttachmentView } from './TaskSummaryCardAttachment'
import { FaithStreakCardAttachmentView } from './FaithStreakCardAttachment'
import { FocusScoreCardAttachmentView } from './FocusScoreCardAttachment'
import { PlannedVsActualCardAttachmentView } from './PlannedVsActualCardAttachment'

interface ChatAttachmentRendererProps {
  attachment: ChatAttachment
}

export function ChatAttachmentRenderer({
  attachment,
}: ChatAttachmentRendererProps): React.JSX.Element | null {
  switch (attachment.type) {
    case 'schedule_card':
      return <ScheduleCardAttachmentView attachment={attachment} />
    case 'task_summary_card':
      return <TaskSummaryCardAttachmentView attachment={attachment} />
    case 'faith_streak_card':
      return <FaithStreakCardAttachmentView attachment={attachment} />
    case 'focus_score_card':
      return <FocusScoreCardAttachmentView attachment={attachment} />
    case 'planned_vs_actual_card':
      return <PlannedVsActualCardAttachmentView attachment={attachment} />
    default:
      return null
  }
}
