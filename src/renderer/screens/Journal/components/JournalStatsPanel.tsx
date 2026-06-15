interface JournalStatsPanelProps {
  entriesThisMonth: number
  longestStreak: number
  totalWordCount: number
}

export function JournalStatsPanel({
  entriesThisMonth,
  longestStreak,
  totalWordCount,
}: JournalStatsPanelProps): React.JSX.Element {
  return (
    <section className="focus-panel p-5">
      <h3 className="text-sm font-semibold text-text-primary">Stats</h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-text-muted">Entries This Month</dt>
          <dd className="mt-1 text-lg font-semibold text-text-primary">{entriesThisMonth}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Longest Streak</dt>
          <dd className="mt-1 text-lg font-semibold text-text-primary">{longestStreak} days</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Total Words Logged</dt>
          <dd className="mt-1 text-lg font-semibold text-text-primary">{totalWordCount}</dd>
        </div>
      </dl>
    </section>
  )
}
