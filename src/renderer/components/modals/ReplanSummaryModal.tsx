import { useBreakContext } from '@renderer/context/BreakContext'

export function ReplanSummaryModal(): React.JSX.Element | null {
  const { replanSummary, clearReplanSummary } = useBreakContext()

  if (!replanSummary) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-button border border-surface-border bg-surface-card p-5">
        <h3 className="text-lg font-semibold text-text-primary">Day Re-Planned</h3>
        <p className="mt-2 text-sm text-text-muted">{replanSummary.message}</p>
        <div className="mt-4 space-y-2 text-sm text-text-secondary">
          <p>Time lost: {replanSummary.longBreakDurationMinutes} minutes</p>
          <p>Protected blocks unchanged: {replanSummary.protectedBlocksUnchanged}</p>
          {replanSummary.blocksCompressed.length > 0 && (
            <div>
              <p className="font-medium text-text-primary">Compressed blocks</p>
              <ul className="mt-1 list-disc pl-5">
                {replanSummary.blocksCompressed.map((entry) => (
                  <li key={entry.blockId}>
                    {entry.beforeMinutes} min to {entry.afterMinutes} min
                  </li>
                ))}
              </ul>
            </div>
          )}
          {replanSummary.bumpedTaskIds.length > 0 && (
            <p>Bumped tasks to tomorrow: {replanSummary.bumpedTaskIds.length}</p>
          )}
        </div>
        <button
          type="button"
          onClick={clearReplanSummary}
          className="mt-5 rounded-button bg-accent-mint/20 px-4 py-2 text-sm font-medium text-accent-mint"
        >
          Got It
        </button>
      </div>
    </div>
  )
}
