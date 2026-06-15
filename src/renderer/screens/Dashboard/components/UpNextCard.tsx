import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'

export function UpNextCard(): React.JSX.Element {
  const { nextBlock } = useScheduleContext()
  const { formatHHMM } = useDisplayPreferences()

  return (
    <section className="focus-panel h-full">
      <p className="focus-metric-label">Up next</p>
      {nextBlock ? (
        <>
          <p className="mt-3 font-display text-xl font-semibold text-text-primary">{nextBlock.title}</p>
          <p className="mt-2 font-mono text-sm text-accent-cyan">
            {formatHHMM(nextBlock.planned_start.slice(11, 16))}
            {' · '}
            {nextBlock.planned_duration_minutes} min
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-text-muted">No upcoming blocks queued.</p>
      )}
    </section>
  )
}
