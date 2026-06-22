import type { MeetingSlotsCardAttachment } from '@shared/types/chat'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { formatHHMM } from '@shared/utils/displayTime'
import { extractLocalTimeHHMM } from '@shared/utils/scheduleTimestamp'

interface MeetingSlotsCardAttachmentViewProps {
  attachment: MeetingSlotsCardAttachment
}

export function MeetingSlotsCardAttachmentView({
  attachment,
}: MeetingSlotsCardAttachmentViewProps): React.JSX.Element {
  const { timeFormat } = useDisplayPreferences()

  return (
    <div className="mt-2 rounded-xl border border-accent-cyan/20 bg-surface-elevated/80 p-3 text-sm">
      <p className="font-display text-xs font-semibold uppercase tracking-wide text-accent-mint">
        Available slots ({attachment.durationMinutes} min)
      </p>
      <ul className="mt-2 space-y-2">
        {attachment.slots.map((slot) => (
          <li key={`${slot.startAt}-${slot.endAt}`} className="rounded-lg bg-surface/60 px-3 py-2">
            <p className="font-mono text-text-primary">
              {formatHHMM(extractLocalTimeHHMM(slot.startAt), timeFormat)} –{' '}
              {formatHHMM(extractLocalTimeHHMM(slot.endAt), timeFormat)}
            </p>
            <p className="text-xs text-text-muted">{slot.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
