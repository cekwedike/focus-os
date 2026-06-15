import { formatStreakDays } from '@shared/utils/faithStreak'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
}: StreakDisplayProps): React.JSX.Element {
  return (
    <section className="focus-panel p-5">
      <h3 className="text-sm font-semibold text-text-primary">Streaks</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-button border border-accent-mint/30 bg-accent-mint/10 p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Current Streak</p>
          <p className="mt-1 text-2xl font-semibold text-accent-mint">
            {formatStreakDays(currentStreak)}
          </p>
        </div>
        <div className="focus-panel p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Longest Streak</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">
            {formatStreakDays(longestStreak)}
          </p>
        </div>
      </div>
    </section>
  )
}
