import type { LongBreakReasonSummary } from '@shared/types/review'

interface BreakAnalysisSectionProps {
  microBreaks: { count: number; totalMinutes: number }
  longBreaks: { count: number; totalMinutes: number }
  longBreakReasons: LongBreakReasonSummary[]
}

export function BreakAnalysisSection({
  microBreaks,
  longBreaks,
  longBreakReasons,
}: BreakAnalysisSectionProps): React.JSX.Element {
  return (
    <section className="focus-panel p-5">
      <h3 className="text-sm font-semibold text-text-primary">Break Analysis</h3>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="focus-panel p-4">
          <dt className="text-xs text-text-muted">Micro Breaks</dt>
          <dd className="mt-1 text-sm text-text-primary">
            {microBreaks.count} breaks · {microBreaks.totalMinutes} minutes
          </dd>
        </div>
        <div className="focus-panel p-4">
          <dt className="text-xs text-text-muted">Long Breaks</dt>
          <dd className="mt-1 text-sm text-text-primary">
            {longBreaks.count} breaks · {longBreaks.totalMinutes} minutes
          </dd>
        </div>
      </dl>
      {longBreakReasons.length > 0 && (
        <ul className="mt-4 space-y-2">
          {longBreakReasons.map((reason) => (
            <li
              key={reason.reason}
              className="flex items-center justify-between focus-subpanel px-3 py-2 text-sm"
            >
              <span className="text-text-secondary">{reason.reason}</span>
              <span className="text-xs text-text-muted">
                {reason.count}x · {reason.totalMinutes} min
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
