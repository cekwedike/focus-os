import { formatDueBannerText } from '@shared/reminders/checkInCountdownLogic'
import { useCheckInDue } from '@renderer/context/CheckInDueContext'

export function CheckInDueBanner(): React.JSX.Element | null {
  const { dueEntries, acknowledge } = useCheckInDue()

  if (dueEntries.length === 0) {
    return null
  }

  return (
    <div className="border-b border-accent-mint/30 bg-accent-mint/10 px-3 py-2 sm:px-4">
      <div className="space-y-2">
        {dueEntries.map((entry) => {
          const { title, subtitle } = formatDueBannerText(
            entry.label,
            entry.clientName,
            entry.overdueMinutes
          )
          return (
            <div
              key={entry.clientId}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{title}</p>
                <p className="text-xs text-text-muted">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => void acknowledge(entry.clientId)}
                className="focus-btn-primary !px-3 !py-1.5 !text-xs self-start sm:self-auto"
              >
                Done
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
