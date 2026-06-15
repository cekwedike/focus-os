import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { formatCountdownFromMinutes } from '@shared/utils/remainingTime'

interface UpNextCardProps {
  variant?: 'dashboard' | 'sidebar'
}

export function UpNextCard({ variant = 'dashboard' }: UpNextCardProps): React.JSX.Element {
  const { nextBlock } = useScheduleContext()
  const { formatHHMM } = useDisplayPreferences()
  const isSidebar = variant === 'sidebar'
  const panelClass = isSidebar ? 'focus-panel focus-panel-sidebar' : 'focus-panel'

  return (
    <section className={`${panelClass} h-full min-w-0`}>
      <p className="focus-metric-label">Up next</p>
      {nextBlock ? (
        <>
          <p
            className={
              isSidebar
                ? 'mt-3 truncate font-display text-lg font-semibold text-text-primary'
                : 'mt-3 font-display text-xl font-semibold text-text-primary'
            }
          >
            {nextBlock.title}
          </p>
          <p className="mt-2 break-words font-mono text-sm text-accent-cyan">
            {formatHHMM(nextBlock.planned_start.slice(11, 16))}
            {' · '}
            {formatCountdownFromMinutes(nextBlock.planned_duration_minutes)}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-text-muted">No upcoming blocks queued.</p>
      )}
    </section>
  )
}
