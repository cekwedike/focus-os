import { useFaithStreak } from '@renderer/hooks/useFaithStreak'

export function FaithStreakWidget(): React.JSX.Element {
  const { stats, loading } = useFaithStreak()

  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-4">
      <h3 className="text-sm font-semibold text-text-primary">Faith Streak</h3>
      {loading || !stats ? (
        <p className="mt-2 text-sm text-text-muted">Loading streak...</p>
      ) : (
        <div className="mt-2 space-y-1 text-sm text-text-secondary">
          <p>
            Current: <span className="font-medium text-accent-mint">{stats.currentStreak} days</span>
          </p>
          <p>
            Longest: <span className="font-medium text-text-primary">{stats.longestStreak} days</span>
          </p>
        </div>
      )}
    </section>
  )
}
