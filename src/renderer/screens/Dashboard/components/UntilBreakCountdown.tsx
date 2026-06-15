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
    <section className="focus-panel h-full">
      <p className="focus-metric-label">Next break</p>
      {nextMicroBreak ? (
        <p className="mt-3 font-mono text-lg text-accent-cyan">
          {formatHHMM(nextMicroBreak.planned_start.slice(11, 16))}
        </p>
      ) : (
        <p className="mt-3 text-sm text-text-muted">No micro-break slot scheduled.</p>
      )}
    </section>
  )
}
