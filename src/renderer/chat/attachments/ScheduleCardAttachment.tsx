import type { ScheduleCardAttachment } from '@shared/types/chat'
import { extractLocalTimeHHMM } from '@shared/utils/scheduleTimestamp'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'

function formatScheduleClock(
  iso: string | undefined,
  formatHHMM: (hhmm: string) => string
): string {
  if (!iso) {
    return 'TBD'
  }
  return formatHHMM(extractLocalTimeHHMM(iso))
}

interface ScheduleCardAttachmentViewProps {
  attachment: ScheduleCardAttachment
}

export function ScheduleCardAttachmentView({
  attachment,
}: ScheduleCardAttachmentViewProps): React.JSX.Element {
  const { formatHHMM } = useDisplayPreferences()

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
                {formatScheduleClock(block.planned_start, formatHHMM)} to{' '}
                {formatScheduleClock(block.planned_end, formatHHMM)}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
