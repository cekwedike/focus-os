import { useCallback, useMemo, useState } from 'react'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useBreakContext } from '@renderer/context/BreakContext'
import { useFaithEntry } from '@renderer/context/FaithEntryContext'
import { assistantLexicon } from '@shared/copy/assistantLexicon'
import { ActiveBlockTimer } from '@renderer/components/schedule/ActiveBlockTimer'
import { HudChronoDisplay } from '@renderer/components/chrono/HudChronoDisplay'
import {
  NotificationCenterPanel,
  useNotificationCenterCount,
} from '@renderer/components/notifications/NotificationCenterPanel'
import '@renderer/components/notifications/notification-center.css'

function minutesUntil(iso: string | undefined): number | null {
  if (!iso) {
    return null
  }
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000))
}

export function TopStatusBar(): React.JSX.Element {
  const { activeBlock, refresh } = useScheduleContext()
  const { longBreakActive, longBreakStartedAt, longBreakPlannedMinutes, openLongBreakModal, endLongBreak } =
    useBreakContext()
  const { isFaithBlockActive, openFaithEntry } = useFaithEntry()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationCount = useNotificationCenterCount()

  const toggleNotifications = useCallback(() => {
    setNotificationsOpen((open) => !open)
  }, [])

  const nowPlayingLabel = useMemo(() => {
    if (longBreakActive) {
      return 'Long break'
    }
    if (activeBlock?.status === 'active') {
      return assistantLexicon.nowPlaying(
        activeBlock.title,
        minutesUntil(activeBlock.planned_end)
      )
    }
    return assistantLexicon.awaitingSchedule
  }, [activeBlock, longBreakActive])

  const isLive = Boolean(activeBlock) || longBreakActive

  return (
    <header className="focus-status-rail relative z-20">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {isLive ? (
            <span className="focus-live-dot shrink-0" aria-hidden="true" />
          ) : (
            <span className="focus-live-dot-idle shrink-0" aria-hidden="true" />
          )}
          <HudChronoDisplay showSeconds />
        </div>
        <div className="hidden h-5 w-px shrink-0 bg-surface-border sm:block" aria-hidden="true" />
        <p className="hidden truncate text-sm font-medium text-text-primary sm:block">{nowPlayingLabel}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {isFaithBlockActive ? (
          <button type="button" onClick={openFaithEntry} className="focus-btn-primary text-xs sm:text-sm">
            Faith
          </button>
        ) : null}
        {longBreakActive ? (
          <button
            type="button"
            onClick={() => void endLongBreak().then(() => refresh())}
            className="focus-btn-danger text-xs sm:text-sm"
          >
            End break
          </button>
        ) : (
          <button type="button" onClick={openLongBreakModal} className="focus-btn-primary text-xs sm:text-sm">
            Break
          </button>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            className={`focus-btn-ghost relative !p-2 ${notificationsOpen ? 'notification-center-bell-active' : ''}`}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notificationCount > 0 ? (
              <span className="notification-center-badge" aria-hidden="true">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            ) : null}
          </button>
          <NotificationCenterPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        </div>
      </div>
    </header>
  )
}
