import { useScheduleContext } from '@renderer/context/ScheduleContext'

export function FocusScoreWidget(): React.JSX.Element {
  const { dayBundle } = useScheduleContext()
  const score = dayBundle?.focusScore

  return (
    <section className="focus-panel h-full">
      <p className="focus-metric-label">Focus score</p>
      <p className="focus-metric-value mt-2">
        {score === null || score === undefined ? '--' : `${score}%`}
      </p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-mint to-accent-cyan transition-all duration-500"
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-text-muted">Completed work blocks today</p>
    </section>
  )
}
