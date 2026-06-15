import { useEffect, useState } from 'react'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useBreakContext } from '@renderer/context/BreakContext'
import { useFaithEntry } from '@renderer/context/FaithEntryContext'
import { useFaithStreak } from '@renderer/hooks/useFaithStreak'
import { ActiveBlockTimer } from '@renderer/components/schedule/ActiveBlockTimer'

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

export function TopStatusBar(): React.JSX.Element {
  const { formatClock } = useDisplayPreferences()
  const { activeBlock, dayBundle, refresh } = useScheduleContext()
  const { longBreakActive, longBreakStartedAt, openLongBreakModal, endLongBreak } = useBreakContext()
  const { stats: faithStats } = useFaithStreak()
  const { isFaithBlockActive, openFaithEntry } = useFaithEntry()
  const [currentTime, setCurrentTime] = useState(() => formatClock(new Date()))

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(formatClock(new Date()))
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [formatClock])

  const focusLabel =
    dayBundle?.focusScore === null || dayBundle?.focusScore === undefined
      ? '--'
      : `${dayBundle.focusScore}%`

  const faithStreakLabel =
    faithStats === null ? '--' : `${faithStats.currentStreak}d`

  const isLive = Boolean(activeBlock) || longBreakActive

  return (
    <header className="focus-status-rail relative z-20">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          {isLive ? <span className="focus-live-dot" aria-hidden="true" /> : <span className="focus-live-dot-idle" aria-hidden="true" />}
          <time
            className="font-mono text-base font-medium tabular-nums tracking-wide text-text-primary"
            dateTime={new Date().toISOString()}
          >
            {currentTime}
          </time>
        </div>
        <div className="hidden h-5 w-px bg-surface-border sm:block" aria-hidden="true" />
        <div className="hidden min-w-0 sm:block">
          <p className="focus-metric-label">Current block</p>
          <p className="truncate text-sm font-medium text-text-primary">
            {longBreakActive
              ? 'Long break in progress'
              : activeBlock?.title ?? 'Awaiting schedule'}
          </p>
        </div>
        {longBreakActive && longBreakStartedAt && (
          <ActiveBlockTimer startedAt={longBreakStartedAt} />
        )}
        {activeBlock?.status === 'active' && activeBlock.actual_start && !longBreakActive && (
          <ActiveBlockTimer startedAt={activeBlock.actual_start} />
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="focus-badge focus-badge-mint" title="Faith streak">
          Streak {faithStreakLabel}
        </span>
        <span className="focus-badge focus-badge-slate" title="Focus score">
          Focus {focusLabel}
        </span>
        {isFaithBlockActive && (
          <button type="button" onClick={openFaithEntry} className="focus-btn-primary hidden sm:inline-flex">
            Log Faith
          </button>
        )}
        {longBreakActive ? (
          <button
            type="button"
            onClick={() => void endLongBreak().then(() => refresh())}
            className="focus-btn-danger"
          >
            End Break
          </button>
        ) : (
          <button type="button" onClick={openLongBreakModal} className="focus-btn-primary">
            Long Break
          </button>
        )}
        <button
          type="button"
          className="focus-btn-ghost !px-2.5 !py-2"
          aria-label="Notifications"
        >
          <NotificationBellIcon />
        </button>
      </div>
    </header>
  )
}
