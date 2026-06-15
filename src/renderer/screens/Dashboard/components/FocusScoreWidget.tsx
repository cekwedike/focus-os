import { useScheduleContext } from '@renderer/context/ScheduleContext'

interface FocusScoreWidgetProps {
  variant?: 'dashboard' | 'sidebar'
}

export function FocusScoreWidget({ variant = 'dashboard' }: FocusScoreWidgetProps): React.JSX.Element {
  const { dayBundle } = useScheduleContext()
  const score = dayBundle?.focusScore
  const panelClass =
    variant === 'sidebar' ? 'focus-panel focus-panel-sidebar' : 'focus-panel'

  return (
    <section className={`${panelClass} h-full min-w-0`}>
      <p className="focus-metric-label">Focus score</p>
      <p className={`focus-metric-value mt-2 ${variant === 'sidebar' ? '!text-3xl' : ''}`}>
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
