import type { ExternalSummaryCardAttachment } from '@shared/types/chat'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { formatHHMM } from '@shared/utils/displayTime'
import { extractLocalTimeHHMM } from '@shared/utils/scheduleTimestamp'

interface ExternalSummaryCardAttachmentViewProps {
  attachment: ExternalSummaryCardAttachment
}

export function ExternalSummaryCardAttachmentView({
  attachment,
}: ExternalSummaryCardAttachmentViewProps): React.JSX.Element {
  const { timeFormat } = useDisplayPreferences()

  return (
    <div className="mt-2 rounded-xl border border-accent-cyan/20 bg-surface-elevated/80 p-3 text-sm">
      <p className="font-display text-xs font-semibold uppercase tracking-wide text-accent-mint">
        External
      </p>
      <ul className="mt-2 space-y-1 text-text-muted">
        {attachment.nextEventTitle ? (
          <li>
            Next event: <span className="text-text-primary">{attachment.nextEventTitle}</span>
            {attachment.nextEventStart ? (
              <span className="text-text-muted">
                {' '}
                at {formatHHMM(extractLocalTimeHHMM(attachment.nextEventStart), timeFormat)}
              </span>
            ) : null}
          </li>
        ) : (
          <li>No upcoming calendar events</li>
        )}
        <li>
          {attachment.actionableEmailCount} actionable email
          {attachment.actionableEmailCount === 1 ? '' : 's'}
        </li>
        <li>
          {attachment.upcomingEventsToday} event
          {attachment.upcomingEventsToday === 1 ? '' : 's'} today
        </li>
        {attachment.conflictCount > 0 ? (
          <li className="text-amber-300">
            {attachment.conflictCount} schedule/calendar conflict
            {attachment.conflictCount === 1 ? '' : 's'}
          </li>
        ) : null}
      </ul>
    </div>
  )
}
