import { useCallback, useEffect, useMemo, useState } from 'react'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useBreakContext } from '@renderer/context/BreakContext'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { assistantLexicon } from '@shared/copy/assistantLexicon'
import { useAssistantNav } from './AssistantNavContext'
import {
  NotificationCenterPanel,
  useNotificationCenterCount,
} from '@renderer/components/notifications/NotificationCenterPanel'
import '@renderer/components/notifications/notification-center.css'

interface AssistantHomeChromeProps {
  onOpenToday: () => void
  onClearChat?: () => void
}

function minutesUntil(iso: string | undefined): number | null {
  if (!iso) {
    return null
  }
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000))
}

export function AssistantHomeChrome({ onOpenToday, onClearChat }: AssistantHomeChromeProps): React.JSX.Element {
  const { openNav, openSettings } = useAssistantNav()
  const { activeBlock } = useScheduleContext()
  const { longBreakActive, openLongBreakModal } = useBreakContext()
  const { formatHHMM } = useDisplayPreferences()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationCount = useNotificationCenterCount()

  const [clockLabel, setClockLabel] = useState(() => formatClockNow())

  function formatClockNow(): string {
    const now = new Date()
    return formatHHMM(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    )
  }

  useEffect(() => {
    const interval = setInterval(() => setClockLabel(formatClockNow()), 30_000)
    return () => clearInterval(interval)
  }, [formatHHMM])

  const statusLabel = useMemo(() => {
    if (longBreakActive) {
      return 'On a break'
    }
    if (activeBlock?.status === 'active') {
      return assistantLexicon.nowPlaying(
        activeBlock.title,
        minutesUntil(activeBlock.planned_end)
      )
    }
    return assistantLexicon.awaitingSchedule
  }, [activeBlock, longBreakActive])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <header className="relative z-20 flex shrink-0 items-center gap-2 border-b border-surface-border/80 bg-surface-base/90 px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-5">
      <button
        type="button"
        onClick={openNav}
        className="focus-btn-ghost !p-2"
        aria-label={assistantLexicon.openMenu}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className="min-w-0 flex-1 text-center">
        <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted">{clockLabel}</p>
        <p className="truncate text-sm font-medium text-text-primary">{statusLabel}</p>
      </div>

      <div className="relative flex items-center gap-1">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className={`focus-btn-ghost relative !p-2 ${
              notificationsOpen ? 'notification-center-bell-active' : ''
            }`}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
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

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="focus-btn-ghost !p-2"
            aria-label="More options"
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <circle cx="5" cy="12" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="19" cy="12" r="1.75" />
            </svg>
          </button>
          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close menu"
                onClick={closeMenu}
              />
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-panel border border-surface-border bg-surface-card py-1 shadow-panel-active">
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-elevated"
                  onClick={() => {
                    onOpenToday()
                    closeMenu()
                  }}
                >
                  {assistantLexicon.dayDetails}
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-elevated"
                  onClick={() => {
                    openLongBreakModal()
                    closeMenu()
                  }}
                >
                  Take a long break
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-elevated"
                  onClick={() => {
                    openSettings()
                    closeMenu()
                  }}
                >
                  {assistantLexicon.openSettings}
                </button>
                {onClearChat ? (
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-surface-elevated"
                    onClick={() => {
                      onClearChat()
                      closeMenu()
                    }}
                  >
                    {assistantLexicon.clearChat}
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
