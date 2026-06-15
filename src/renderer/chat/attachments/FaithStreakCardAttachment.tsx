import type { FaithStreakCardAttachment } from '@shared/types/chat'

interface FaithStreakCardAttachmentViewProps {
  attachment: FaithStreakCardAttachment
}

export function FaithStreakCardAttachmentView({
  attachment,
}: FaithStreakCardAttachmentViewProps): React.JSX.Element {
  return (
    <div className="mt-2 rounded-panel border border-surface-border/80 bg-surface-elevated/40 p-3">
      <p className="focus-kicker mb-2">Faith Streak</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-text-muted">Current</p>
          <p className="text-lg font-semibold text-accent-mint">{attachment.currentStreak}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Longest</p>
          <p className="text-lg font-semibold text-text-primary">{attachment.longestStreak}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Today: {attachment.todayLogged ? 'Logged' : 'Not logged yet'}
        {attachment.entriesThisMonth !== undefined
          ? ` · ${attachment.entriesThisMonth} entries this month`
          : ''}
      </p>
    </div>
  )
}
