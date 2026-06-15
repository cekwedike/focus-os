import { useFaithStreak } from '@renderer/hooks/useFaithStreak'

export function FaithStreakWidget(): React.JSX.Element {
  const { stats, loading } = useFaithStreak()

  return (
    <section className="focus-panel h-full">
      <p className="focus-metric-label">Faith streak</p>
      {loading || !stats ? (
        <p className="mt-3 text-sm text-text-muted">Syncing...</p>
      ) : (
        <>
          <p className="focus-metric-value mt-2">{stats.currentStreak}</p>
          <p className="mt-1 text-xs text-text-muted">
            Longest {stats.longestStreak} days
          </p>
        </>
      )}
    </section>
  )
}
