import { useMemo } from 'react'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'

export function UntilBreakCountdown(): React.JSX.Element {
  const { dayBundle } = useScheduleContext()
  const { formatHHMM } = useDisplayPreferences()

  const nextMicroBreak = useMemo(() => {
    if (!dayBundle) {
      return null
    }
    const now = Date.now()
    return (
      dayBundle.blocks.find(
        (block) =>
          block.protected_subtype === 'micro_break' &&
          block.status === 'planned' &&
          new Date(block.planned_start).getTime() > now
      ) ?? null
    )
  }, [dayBundle])

  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-4">
      <h3 className="text-sm font-semibold text-text-primary">Until Next Break</h3>
      {nextMicroBreak ? (
        <p className="mt-2 text-sm text-text-primary">
          Scheduled micro-break at {formatHHMM(nextMicroBreak.planned_start.slice(11, 16))}
        </p>
      ) : (
        <p className="mt-2 text-sm text-text-muted">No scheduled micro-break slot today.</p>
      )}
    </section>
  )
}
