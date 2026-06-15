import type { FocusScoreCardAttachment } from '@shared/types/chat'

interface FocusScoreCardAttachmentViewProps {
  attachment: FocusScoreCardAttachment
}

export function FocusScoreCardAttachmentView({
  attachment,
}: FocusScoreCardAttachmentViewProps): React.JSX.Element {
  return (
    <div className="mt-2 rounded-panel border border-surface-border/80 bg-surface-elevated/40 p-3">
      <p className="focus-kicker mb-2">Focus Score</p>
      <p className="text-2xl font-semibold text-accent-mint">
        {attachment.score === null ? 'N/A' : `${attachment.score}%`}
      </p>
      <p className="mt-1 text-xs text-text-muted">
        {attachment.completedBlocks}/{attachment.totalWorkBlocks} work blocks completed
      </p>
      {attachment.activeBlockTitle ? (
        <div className="mt-3">
          <p className="text-xs text-text-muted">Active: {attachment.activeBlockTitle}</p>
          {attachment.activeBlockProgressPercent !== null &&
          attachment.activeBlockProgressPercent !== undefined ? (
            <div className="mt-1 h-2 rounded-full bg-surface-elevated/80">
              <div
                className="h-2 rounded-full bg-accent-mint"
                style={{ width: `${attachment.activeBlockProgressPercent}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
