import type { SuggestedTasksCardAttachment } from '@shared/types/chat'

interface SuggestedTasksCardAttachmentViewProps {
  attachment: SuggestedTasksCardAttachment
  onAccept?: (emailId: number) => void
}

export function SuggestedTasksCardAttachmentView({
  attachment,
  onAccept,
}: SuggestedTasksCardAttachmentViewProps): React.JSX.Element {
  return (
    <div className="mt-2 space-y-2">
      {attachment.tasks.map((task) => (
        <div
          key={task.emailId}
          className="rounded-xl border border-accent-cyan/20 bg-surface-elevated/80 p-3 text-sm"
        >
          <p className="font-medium text-text-primary">{task.title}</p>
          <p className="text-xs text-text-muted">
            From {task.fromAddress}
            {task.clientName ? ` · ${task.clientName}` : ''}
          </p>
          <p className="mt-1 text-text-muted">{task.summary}</p>
          {onAccept ? (
            <button
              type="button"
              className="mt-2 rounded-lg border border-accent-mint/40 px-3 py-1 text-xs text-accent-mint hover:bg-accent-mint/10"
              onClick={() => onAccept(task.emailId)}
            >
              Add to queue
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
