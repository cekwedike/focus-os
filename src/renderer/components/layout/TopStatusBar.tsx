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
      className="h-5 w-5"
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
    faithStats === null ? '--' : `${faithStats.currentStreak} days`

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border bg-surface-card px-shell">
      <div className="flex items-center gap-6">
        <time
          className="font-mono text-sm font-medium tabular-nums text-text-primary"
          dateTime={new Date().toISOString()}
        >
          {currentTime}
        </time>
        <div className="hidden h-5 w-px bg-surface-border sm:block" aria-hidden="true" />
        <p className="hidden text-sm text-text-secondary sm:block">
          Active block:{' '}
          <span className="text-text-primary">
            {longBreakActive
              ? 'On long break'
              : activeBlock?.title ?? 'Not scheduled yet'}
          </span>
        </p>
        {longBreakActive && longBreakStartedAt && (
          <ActiveBlockTimer startedAt={longBreakStartedAt} />
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="focus-badge focus-badge-mint" title="Faith streak">
          Faith Streak: {faithStreakLabel}
        </span>
        {isFaithBlockActive && (
          <button
            type="button"
            onClick={openFaithEntry}
            className="rounded-button border border-accent-mint/40 bg-accent-mint/10 px-3 py-1.5 text-sm font-medium text-accent-mint"
          >
            Log Faith Time
          </button>
        )}
        <span className="focus-badge focus-badge-slate" title="Focus score">
          Focus: {focusLabel}
        </span>
        {longBreakActive ? (
          <button
            type="button"
            onClick={() => void endLongBreak().then(() => refresh())}
            className="rounded-button border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-sm font-medium text-amber-200"
          >
            End Break
          </button>
        ) : (
          <button
            type="button"
            onClick={openLongBreakModal}
            className="rounded-button border border-accent-mint/40 bg-accent-mint/10 px-3 py-1.5 text-sm font-medium text-accent-mint transition-colors hover:bg-accent-mint/20"
          >
            Take A Long Break
          </button>
        )}
        <button
          type="button"
          className="rounded-button border border-surface-border bg-surface-elevated p-2 text-text-secondary transition-colors hover:text-text-primary"
          aria-label="Notifications"
        >
          <NotificationBellIcon />
        </button>
      </div>
    </header>
  )
}
