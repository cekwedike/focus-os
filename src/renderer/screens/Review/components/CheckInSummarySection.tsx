import { SettingsSectionCard } from '@renderer/components/ui/SettingsSectionCard'
import type { CheckInClientSummary } from '@shared/review/checkInSummary'

interface CheckInSummarySectionProps {
  summaries: CheckInClientSummary[]
}

export function CheckInSummarySection({
  summaries,
}: CheckInSummarySectionProps): React.JSX.Element {
  return (
    <SettingsSectionCard
      title="Recurring Check-ins"
      description="How often you acknowledged client check-ins compared to your configured intervals."
    >
      {summaries.length === 0 ? (
        <p className="text-sm text-text-muted">No check-in history in this range.</p>
      ) : (
        <div className="space-y-3">
          {summaries.map((summary) => (
            <div key={summary.clientId} className="rounded-panel border border-surface-border p-3">
              <h4 className="font-medium text-text-primary">{summary.clientName}</h4>
              <dl className="mt-2 grid gap-1 text-xs text-text-muted sm:grid-cols-3">
                <div>
                  <dt className="uppercase tracking-wide">Check-ins</dt>
                  <dd className="text-sm text-text-secondary">{summary.checkInCount}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide">Avg interval</dt>
                  <dd className="text-sm text-text-secondary">
                    {summary.averageActualIntervalMinutes === null
                      ? 'First only'
                      : `${summary.averageActualIntervalMinutes} min`}
                  </dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide">Overdue</dt>
                  <dd className="text-sm text-text-secondary">{summary.overdueCount}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </SettingsSectionCard>
  )
}
