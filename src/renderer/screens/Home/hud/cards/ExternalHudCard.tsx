import { useEffect, useState } from 'react'
import type { ExternalDaySummary } from '@shared/types/integrations'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { formatHHMM } from '@shared/utils/displayTime'
import { extractLocalTimeHHMM } from '@shared/utils/scheduleTimestamp'

export function ExternalHudCard(): React.JSX.Element {
  const { timeFormat } = useDisplayPreferences()
  const [summary, setSummary] = useState<ExternalDaySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async (): Promise<void> => {
      try {
        const data = await window.focusOS.integrations.externalSummary()
        if (active) {
          setSummary(data)
        }
      } catch {
        if (active) {
          setSummary(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()
    const interval = setInterval(() => void load(), 60_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return (
    <article className="hud-card col-span-full">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="hud-kicker">External</p>
          <h3 className="font-display text-sm font-semibold text-text-primary">Calendar & Inbox</h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          {loading ? 'Sync' : 'Live'}
        </span>
      </header>

      <div className="mt-3 space-y-2 text-xs text-text-muted">
        {summary?.nextCalendarEvent ? (
          <p>
            Next:{' '}
            <span className="text-text-primary">{summary.nextCalendarEvent.title}</span>{' '}
            <span className="font-mono text-accent-cyan">
              {formatHHMM(
                extractLocalTimeHHMM(summary.nextCalendarEvent.startAt),
                timeFormat
              )}
            </span>
          </p>
        ) : (
          <p>No upcoming calendar events</p>
        )}
        <p>
          {summary?.actionableEmailCount ?? 0} actionable email
          {(summary?.actionableEmailCount ?? 0) === 1 ? '' : 's'}
        </p>
        {(summary?.scheduleConflicts.length ?? 0) > 0 ? (
          <p className="text-amber-300">
            {summary?.scheduleConflicts.length} schedule conflict
            {(summary?.scheduleConflicts.length ?? 0) === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>
    </article>
  )
}
