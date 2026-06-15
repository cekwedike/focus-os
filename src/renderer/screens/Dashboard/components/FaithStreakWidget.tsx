import { useFaithStreak } from '@renderer/hooks/useFaithStreak'

interface FaithStreakWidgetProps {
  variant?: 'dashboard' | 'sidebar'
}

export function FaithStreakWidget({ variant = 'dashboard' }: FaithStreakWidgetProps): React.JSX.Element {
  const { stats, loading } = useFaithStreak()
  const panelClass =
    variant === 'sidebar' ? 'focus-panel focus-panel-sidebar' : 'focus-panel'

  return (
    <section className={`${panelClass} h-full min-w-0`}>
      <p className="focus-metric-label">Faith streak</p>
      {loading || !stats ? (
        <p className="mt-3 text-sm text-text-muted">Syncing...</p>
      ) : (
        <>
          <p className={`focus-metric-value mt-2 ${variant === 'sidebar' ? '!text-3xl' : ''}`}>
            {stats.currentStreak}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Longest {stats.longestStreak} days
          </p>
        </>
      )}
    </section>
  )
}
