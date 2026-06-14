import { useScheduleContext } from '@renderer/context/ScheduleContext'

export function FocusScoreWidget(): React.JSX.Element {
  const { dayBundle } = useScheduleContext()
  const score = dayBundle?.focusScore

  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-4">
      <h3 className="text-sm font-semibold text-text-primary">Focus Score</h3>
      <p className="mt-2 text-3xl font-semibold text-accent-mint">
        {score === null || score === undefined ? '--' : `${score}%`}
      </p>
      <p className="mt-1 text-xs text-text-muted">Completed work blocks vs planned for today</p>
    </section>
  )
}
