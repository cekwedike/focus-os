import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'

export function UpNextCard(): React.JSX.Element {
  const { nextBlock } = useScheduleContext()
  const { formatHHMM } = useDisplayPreferences()

  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-4">
      <h3 className="text-sm font-semibold text-text-primary">Up Next</h3>
      {nextBlock ? (
        <>
          <p className="mt-2 text-base font-medium text-text-primary">{nextBlock.title}</p>
          <p className="mt-1 font-mono text-xs text-text-muted">
            {formatHHMM(nextBlock.planned_start.slice(11, 16))} · {nextBlock.planned_duration_minutes} min
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-text-muted">Nothing else planned for today.</p>
      )}
    </section>
  )
}
