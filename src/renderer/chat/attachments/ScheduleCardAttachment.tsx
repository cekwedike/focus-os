import type { ScheduleCardAttachment } from '@shared/types/chat'

function formatClock(iso: string | undefined): string {
  if (!iso) {
    return 'TBD'
  }
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

interface ScheduleCardAttachmentViewProps {
  attachment: ScheduleCardAttachment
}

export function ScheduleCardAttachmentView({
  attachment,
}: ScheduleCardAttachmentViewProps): React.JSX.Element {
  return (
    <div className="mt-2 rounded-panel border border-surface-border/80 bg-surface-elevated/40 p-3">
      <p className="focus-kicker mb-2">Today&apos;s Schedule</p>
      <ul className="space-y-2">
        {attachment.blocks.map((block) => {
          const highlighted = attachment.highlightBlockId === block.id
          return (
            <li
              key={block.id}
              className={`rounded-button border px-2.5 py-2 text-xs ${
                highlighted
                  ? 'border-accent-mint/40 bg-accent-mint/10'
                  : 'border-surface-border/60 bg-surface-card/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-text-primary">{block.title}</span>
                <span className="text-text-muted">{block.status}</span>
              </div>
              <p className="mt-1 text-text-muted">
                {formatClock(block.planned_start)} to {formatClock(block.planned_end)}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
