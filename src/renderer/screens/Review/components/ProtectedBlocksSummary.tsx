import type { ProtectedBlockDaySummary } from '@shared/types/review'

interface ProtectedBlocksSummaryProps {
  summaries: ProtectedBlockDaySummary[]
}

export function ProtectedBlocksSummary({
  summaries,
}: ProtectedBlocksSummaryProps): React.JSX.Element {
  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-5">
      <h3 className="text-sm font-semibold text-text-primary">Protected Blocks</h3>
      {summaries.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No protected blocks in this range.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {summaries.map((summary) => (
            <li
              key={summary.protectedSubtype}
              className="rounded-button border border-surface-border bg-surface-elevated px-4 py-3 text-sm text-text-secondary"
            >
              {summary.label} block completed {summary.daysCompleted}/{summary.daysWithBlock} days
              in range
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
