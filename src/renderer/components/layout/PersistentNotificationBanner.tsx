import { formatBannerTimeSubtitle } from '@shared/notifications/formatBannerTime'
import { useNotifications } from '@renderer/context/NotificationContext'

export function PersistentNotificationBanner(): React.JSX.Element | null {
  const { activeNotifications, performAction } = useNotifications()

  if (activeNotifications.length === 0) {
    return null
  }

  const nowMs = Date.now()

  return (
    <div className="border-b border-accent-mint/30 bg-accent-mint/10 px-3 py-2 sm:px-4">
      <div className="space-y-2">
        {activeNotifications.map((entry) => {
          const subtitle = formatBannerTimeSubtitle(entry.createdAt, nowMs)
          return (
            <div
              key={entry.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{entry.title}</p>
                <p className="text-xs text-text-muted">{entry.message}</p>
                <p className="text-xs text-text-muted">{subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                {entry.actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => void performAction(entry.id, action.id)}
                    className="focus-btn-primary !px-3 !py-1.5 !text-xs"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
