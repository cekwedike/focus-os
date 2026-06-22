import type { ProposedActionsCardAttachment } from '@shared/types/chat'

interface ProposedActionsCardAttachmentViewProps {
  attachment: ProposedActionsCardAttachment
  onAction?: (sendText: string) => void
}

export function ProposedActionsCardAttachmentView({
  attachment,
  onAction,
}: ProposedActionsCardAttachmentViewProps): React.JSX.Element {
  return (
    <div className="mt-2 rounded-xl border border-amber-400/30 bg-surface-elevated/80 p-3 text-sm">
      <p className="font-display text-xs font-semibold uppercase tracking-wide text-amber-300">
        {attachment.title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {attachment.actions.map((action) => (
          <button
            key={action.id}
            type="button"
            title={action.description}
            className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-400/10"
            onClick={() => onAction?.(action.sendText)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
