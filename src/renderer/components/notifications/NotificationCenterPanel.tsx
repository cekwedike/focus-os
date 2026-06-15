import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { DueCheckInEntry } from '@shared/types/ipc'
import type { ActiveNotificationSummary, NotificationType } from '@shared/types/notifications'
import { formatBannerTimeSubtitle } from '@shared/notifications/formatBannerTime'
import { useNotifications } from '@renderer/context/NotificationContext'
import '@renderer/screens/Home/hud/hud.css'
import './notification-center.css'

const TYPE_LABELS: Record<NotificationType, string> = {
  micro_break: 'Micro-Break',
  check_in_due: 'Check-In',
  block_warning: 'Block Warning',
  block_complete: 'Block Complete',
  block_skipped: 'Block Skipped',
  faith_reminder: 'Faith Reminder',
  staleness_alert: 'Staleness',
  generic: 'System',
}

function getNotifiedCheckInClientIds(
  notifications: ActiveNotificationSummary[]
): Set<number> {
  const clientIds = new Set<number>()
  for (const entry of notifications) {
    if (entry.type !== 'check_in_due') {
      continue
    }
    const clientId = entry.metadata.clientId
    if (typeof clientId === 'number') {
      clientIds.add(clientId)
    }
  }
  return clientIds
}

function formatCheckInSubtitle(entry: DueCheckInEntry): string {
  if (entry.overdueMinutes <= 0) {
    return 'Due now'
  }
  if (entry.overdueMinutes === 1) {
    return '1 min overdue'
  }
  return `${entry.overdueMinutes} min overdue`
}

interface NotificationCenterPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationCenterPanel({
  open,
  onClose,
}: NotificationCenterPanelProps): React.JSX.Element | null {
  const {
    activeNotifications,
    dueCheckInEntries,
    performAction,
    refreshNotifications,
  } = useNotifications()

  useEffect(() => {
    if (!open) {
      return
    }

    void refreshNotifications()
  }, [open, refreshNotifications])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const orphanCheckIns = useMemo(() => {
    const notifiedClientIds = getNotifiedCheckInClientIds(activeNotifications)
    return dueCheckInEntries.filter((entry) => !notifiedClientIds.has(entry.clientId))
  }, [activeNotifications, dueCheckInEntries])

  const totalCount = activeNotifications.length + orphanCheckIns.length
  const nowMs = Date.now()

  const handleAcknowledgeCheckIn = async (clientId: number): Promise<void> => {
    await window.focusOS.checkIns.acknowledge({ clientId })
    await refreshNotifications()
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="notification-center-backdrop"
            aria-label="Close notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className="notification-center-panel hud-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-center-title"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <span className="hud-corner-bracket hud-corner-tl" aria-hidden="true" />
            <span className="hud-corner-bracket hud-corner-tr" aria-hidden="true" />
            <span className="hud-corner-bracket hud-corner-bl" aria-hidden="true" />
            <span className="hud-corner-bracket hud-corner-br" aria-hidden="true" />

            <header className="notification-center-header">
              <div>
                <p className="hud-kicker">Alert Queue</p>
                <h2
                  id="notification-center-title"
                  className="font-display text-sm font-bold text-text-primary"
                >
                  Notifications
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="notification-center-count">
                  {totalCount} Active
                </span>
                <button
                  type="button"
                  className="notification-center-close"
                  aria-label="Close notifications panel"
                  onClick={onClose}
                >
                  ×
                </button>
              </div>
            </header>

            <div className="notification-center-body">
              {totalCount === 0 ? (
                <div className="notification-center-empty">
                  <p className="text-sm font-medium text-text-primary">All clear</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Check-ins, breaks, and system alerts will appear here when they need your
                    attention.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {activeNotifications.map((entry) => (
                    <li
                      key={entry.id}
                      className={`notification-center-item ${
                        entry.urgency === 'high' ? 'notification-center-item-high' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="notification-center-type">
                            {TYPE_LABELS[entry.type]}
                          </span>
                          {entry.urgency === 'high' ? (
                            <span className="notification-center-urgent">High</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm font-medium text-text-primary">{entry.title}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{entry.message}</p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          {formatBannerTimeSubtitle(entry.createdAt, nowMs)}
                        </p>
                      </div>
                      {entry.actions.length > 0 ? (
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                          {entry.actions.map((action) => (
                            <button
                              key={action.id}
                              type="button"
                              className="focus-btn-primary !px-2.5 !py-1 !text-[11px]"
                              onClick={() => void performAction(entry.id, action.id)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}

                  {orphanCheckIns.map((entry) => (
                    <li
                      key={`check-in-${entry.clientId}`}
                      className="notification-center-item notification-center-item-high"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="notification-center-type">Check-in</span>
                          <span className="notification-center-urgent">High</span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-text-primary">
                          {entry.clientName}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">{entry.label}</p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          {formatCheckInSubtitle(entry)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="focus-btn-primary !px-2.5 !py-1 !text-[11px]"
                        onClick={() => void handleAcknowledgeCheckIn(entry.clientId)}
                      >
                        Done
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export function useNotificationCenterCount(): number {
  const { activeNotifications, dueCheckInEntries } = useNotifications()
  const orphanCheckIns = useMemo(() => {
    const notifiedClientIds = getNotifiedCheckInClientIds(activeNotifications)
    return dueCheckInEntries.filter((entry) => !notifiedClientIds.has(entry.clientId))
  }, [activeNotifications, dueCheckInEntries])

  return activeNotifications.length + orphanCheckIns.length
}
