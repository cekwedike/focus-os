import type { ChatAttachment } from '@shared/types/chat'
import { ScheduleCardAttachmentView } from './ScheduleCardAttachment'
import { TaskSummaryCardAttachmentView } from './TaskSummaryCardAttachment'
import { FaithStreakCardAttachmentView } from './FaithStreakCardAttachment'
import { FocusScoreCardAttachmentView } from './FocusScoreCardAttachment'
import { PlannedVsActualCardAttachmentView } from './PlannedVsActualCardAttachment'
import { ExternalSummaryCardAttachmentView } from './ExternalSummaryCardAttachment'
import { SuggestedTasksCardAttachmentView } from './SuggestedTasksCardAttachment'
import { MeetingSlotsCardAttachmentView } from './MeetingSlotsCardAttachment'
import { ProposedActionsCardAttachmentView } from './ProposedActionsCardAttachment'

interface ChatAttachmentRendererProps {
  attachment: ChatAttachment
  onSendText?: (text: string) => void
  onAcceptEmailTask?: (emailId: number) => void
}

export function ChatAttachmentRenderer({
  attachment,
  onSendText,
  onAcceptEmailTask,
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
    case 'external_summary_card':
      return <ExternalSummaryCardAttachmentView attachment={attachment} />
    case 'suggested_tasks_card':
      return (
        <SuggestedTasksCardAttachmentView
          attachment={attachment}
          onAccept={onAcceptEmailTask}
        />
      )
    case 'meeting_slots_card':
      return <MeetingSlotsCardAttachmentView attachment={attachment} />
    case 'proposed_actions_card':
      return (
        <ProposedActionsCardAttachmentView attachment={attachment} onAction={onSendText} />
      )
    default:
      return null
  }
}
