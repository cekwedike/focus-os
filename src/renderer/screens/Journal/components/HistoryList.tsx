import { TextInput } from '@renderer/components/ui/TextInput'
import type { FaithLogRow } from '@shared/types/db'

interface HistoryListProps {
  entries: FaithLogRow[]
  search: string
  onSearchChange: (value: string) => void
}

export function HistoryList({
  entries,
  search,
  onSearchChange,
}: HistoryListProps): React.JSX.Element {
  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-text-primary">History</h3>
        <div className="w-full sm:max-w-xs">
          <TextInput
            value={search}
            onChange={onSearchChange}
            placeholder="Search reading or notes"
          />
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No past entries match your search.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-button border border-surface-border bg-surface-elevated p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-text-muted">{entry.entry_date}</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">{entry.bible_reference}</p>
                  {entry.prayer_notes && (
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-text-secondary">
                      {entry.prayer_notes}
                    </p>
                  )}
                </div>
                <span className="text-xs text-text-muted">{entry.word_count} words</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
