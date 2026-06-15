import type { InsightLogRow } from '@shared/types/insights'

interface InsightHistoryListProps {
  entries: InsightLogRow[]
}

export function InsightHistoryList({ entries }: InsightHistoryListProps): React.JSX.Element {
  const historyEntries = entries.slice(1)

  return (
    <section className="focus-panel p-5">
      <h3 className="text-sm font-semibold text-text-primary">History</h3>
      {historyEntries.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No previous insights yet.</p>
      ) : (
        <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">
          {historyEntries.map((entry) => (
            <li
              key={entry.id}
              className="focus-panel p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-muted">{entry.insight_date}</p>
                <span className="text-xs capitalize text-text-muted">{entry.source}</span>
              </div>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-text-secondary">
                {entry.content_markdown}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
