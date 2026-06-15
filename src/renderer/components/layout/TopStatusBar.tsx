import { useCallback, useState } from 'react'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useBreakContext } from '@renderer/context/BreakContext'
import { useFaithEntry } from '@renderer/context/FaithEntryContext'
import { useFaithStreak } from '@renderer/hooks/useFaithStreak'
import { formatStreakDays } from '@shared/utils/faithStreak'
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

interface TopStatusBarProps {
  onToggleNav: () => void
  navOpen: boolean
}

export function TopStatusBar({ onToggleNav, navOpen }: TopStatusBarProps): React.JSX.Element {
  const { activeBlock, dayBundle, refresh } = useScheduleContext()
  const { longBreakActive, longBreakStartedAt, longBreakPlannedMinutes, openLongBreakModal, endLongBreak } = useBreakContext()
  const { stats: faithStats } = useFaithStreak()
  const { isFaithBlockActive, openFaithEntry } = useFaithEntry()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationCount = useNotificationCenterCount()

  const closeNotifications = useCallback(() => setNotificationsOpen(false), [])
  const toggleNotifications = useCallback(() => {
    setNotificationsOpen((open) => !open)
  }, [])

  const focusLabel =
    dayBundle?.focusScore === null || dayBundle?.focusScore === undefined
      ? '--'
      : `${dayBundle.focusScore}%`

  const faithStreakLabel =
    faithStats === null ? '--' : formatStreakDays(faithStats.currentStreak)

  const isLive = Boolean(activeBlock) || longBreakActive

  const blockTitle = longBreakActive
    ? 'Long Break'
    : activeBlock?.title ?? 'Awaiting Schedule'

  return (
    <header className="focus-status-rail relative z-20">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleNav}
          className={`focus-btn-ghost !px-2.5 !py-2 md:hidden ${navOpen ? 'border-accent-mint/40' : ''}`}
          aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={navOpen}
        >
          <MenuIcon />
        </button>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {isLive ? (
            <span className="focus-live-dot shrink-0" aria-hidden="true" />
          ) : (
            <span className="focus-live-dot-idle shrink-0" aria-hidden="true" />
          )}
          <HudChronoDisplay variant="rail" showSeconds />
        </div>

        <div className="hidden h-5 w-px shrink-0 bg-surface-border lg:block" aria-hidden="true" />

        <div className="hidden min-w-0 lg:block">
          <p className="focus-metric-label">Current Block</p>
          <p className="truncate text-sm font-medium text-text-primary">{blockTitle}</p>
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
        <span className="focus-badge focus-badge-mint !px-2 !py-0.5 text-[11px] sm:!px-2.5 sm:text-xs" title="Faith streak">
          <span className="hidden sm:inline">Streak </span>
          {faithStreakLabel}
        </span>
        <span className="focus-badge focus-badge-slate !px-2 !py-0.5 text-[11px] sm:!px-2.5 sm:text-xs" title="Focus score">
          <span className="hidden sm:inline">Focus </span>
          {focusLabel}
        </span>
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
