import { useEffect, useState } from 'react'

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

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
  const [currentTime, setCurrentTime] = useState(() => formatClockTime(new Date()))

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(formatClockTime(new Date()))
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

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
          Active block: <span className="text-text-muted">Not scheduled yet</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="focus-badge focus-badge-mint" title="Faith streak placeholder">
          Faith streak: 0 days
        </span>
        <span className="focus-badge focus-badge-slate" title="Focus score placeholder">
          Focus: --
        </span>
        <button
          type="button"
          className="rounded-button border border-accent-mint/40 bg-accent-mint/10 px-3 py-1.5 text-sm font-medium text-accent-mint transition-colors hover:bg-accent-mint/20"
          onClick={() => undefined}
        >
          Take a Long Break
        </button>
        <button
          type="button"
          className="rounded-button border border-surface-border bg-surface-elevated p-2 text-text-secondary transition-colors hover:text-text-primary"
          aria-label="Notifications"
          onClick={() => undefined}
        >
          <NotificationBellIcon />
        </button>
      </div>
    </header>
  )
}
