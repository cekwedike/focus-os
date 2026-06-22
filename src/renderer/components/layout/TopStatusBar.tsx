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

function NotificationBellIcon(): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  )
}

function MenuIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function GearIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      />
    </svg>
  )
}

interface TopStatusBarProps {
  onOpenMenu?: () => void
  onOpenSettings?: () => void
  navOpen: boolean
}

function minutesUntil(iso: string | undefined): number | null {
  if (!iso) {
    return null
  }
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 60_000))
}

export function TopStatusBar({
  onOpenMenu,
  onOpenSettings,
  navOpen,
}: TopStatusBarProps): React.JSX.Element {
  const { activeBlock, refresh } = useScheduleContext()
  const { longBreakActive, longBreakStartedAt, longBreakPlannedMinutes, openLongBreakModal, endLongBreak } =
    useBreakContext()
  const { isFaithBlockActive, openFaithEntry } = useFaithEntry()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationCount = useNotificationCenterCount()

  const closeNotifications = useCallback(() => setNotificationsOpen(false), [])
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
        {onOpenMenu ? (
          <button
            type="button"
            onClick={onOpenMenu}
            className={`focus-btn-ghost !px-2.5 !py-2 ${navOpen ? 'border-accent-mint/40' : ''}`}
            aria-label={assistantLexicon.openMenu}
            aria-expanded={navOpen}
          >
            <MenuIcon />
          </button>
        ) : null}

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {isLive ? (
            <span className="focus-live-dot shrink-0" aria-hidden="true" />
          ) : (
            <span className="focus-live-dot-idle shrink-0" aria-hidden="true" />
          )}
          <HudChronoDisplay showSeconds />
        </div>

        <div className="hidden h-5 w-px shrink-0 bg-surface-border sm:block" aria-hidden="true" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{nowPlayingLabel}</p>
        </div>

        {longBreakActive && longBreakStartedAt ? (
          <div className="hidden shrink-0 sm:block">
            <ActiveBlockTimer
              startedAt={longBreakStartedAt}
              durationMinutes={longBreakPlannedMinutes}
            />
          </div>
        ) : null}
        {activeBlock?.status === 'active' && activeBlock.actual_start && !longBreakActive ? (
          <div className="hidden shrink-0 sm:block">
            <ActiveBlockTimer startedAt={activeBlock.actual_start} endsAt={activeBlock.planned_end} />
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {isFaithBlockActive ? (
          <button
            type="button"
            onClick={openFaithEntry}
            className="focus-btn-primary hidden !px-2.5 !py-1.5 text-xs sm:inline-flex sm:!px-4 sm:!py-2 sm:text-sm"
          >
            Faith
          </button>
        ) : null}
        {longBreakActive ? (
          <button
            type="button"
            onClick={() => void endLongBreak().then(() => refresh())}
            className="focus-btn-danger !px-2.5 !py-1.5 text-xs sm:!px-4 sm:!py-2 sm:text-sm"
          >
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">End Break</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openLongBreakModal}
            className="focus-btn-primary !px-2.5 !py-1.5 text-xs sm:!px-4 sm:!py-2 sm:text-sm"
          >
            <span className="sm:hidden">Break</span>
            <span className="hidden sm:inline">Long Break</span>
          </button>
        )}
        {onOpenSettings ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="focus-btn-ghost !px-2 !py-1.5 sm:!px-2.5 sm:!py-2"
            aria-label={assistantLexicon.openSettings}
          >
            <GearIcon />
          </button>
        ) : null}
        <div className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            className={`focus-btn-ghost relative !px-2 !py-1.5 sm:!px-2.5 sm:!py-2 ${
              notificationsOpen ? 'notification-center-bell-active' : ''
            }`}
            aria-label={
              notificationCount > 0
                ? `Notifications, ${notificationCount} active`
                : 'Notifications'
            }
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
          >
            <NotificationBellIcon />
            {notificationCount > 0 ? (
              <span className="notification-center-badge" aria-hidden="true">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            ) : null}
          </button>
          <NotificationCenterPanel open={notificationsOpen} onClose={closeNotifications} />
        </div>
      </div>
    </header>
  )
}
