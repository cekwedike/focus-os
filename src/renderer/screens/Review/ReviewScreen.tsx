import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'
import { useReviewSummary } from './hooks/useReviewSummary'
import { DateRangeSelector } from './components/DateRangeSelector'
import { PlannedActualChart } from './components/PlannedActualChart'
import { ProtectedBlocksSummary } from './components/ProtectedBlocksSummary'
import { BreakAnalysisSection } from './components/BreakAnalysisSection'
import { CheckInSummarySection } from './components/CheckInSummarySection'
import { TaskCompletionRate } from './components/TaskCompletionRate'

const screen = getScreenDefinition('/review')

export function ReviewScreen(): React.JSX.Element {
  const { range, rangeLabel, summary, loading, error, setPreset, setCustomRange } = useReviewSummary()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ScreenCard title={screen.title} description={screen.description} />
      <DateRangeSelector
        preset={range.preset}
        startDate={range.startDate}
        endDate={range.endDate}
        onPresetChange={setPreset}
        onCustomRangeChange={setCustomRange}
      />
      <p className="text-sm text-text-muted">Showing {rangeLabel}</p>
      {loading && <p className="text-sm text-text-muted">Loading review summary...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
      {summary && (
        <>
          <TaskCompletionRate
            rate={summary.taskCompletionRate}
            scheduledTaskBlocks={summary.scheduledTaskBlocks}
            completedTaskBlocks={summary.completedTaskBlocks}
          />
          <PlannedActualChart
            title="Planned vs Actual by Client"
            groups={summary.clientGroups}
            emptyMessage="No client work blocks in this range."
          />
          <PlannedActualChart
            title="Planned vs Actual by Protected Block"
            groups={summary.protectedGroups}
            emptyMessage="No protected blocks in this range."
          />
          <ProtectedBlocksSummary summaries={summary.protectedDaySummaries} />
          <BreakAnalysisSection
            microBreaks={summary.microBreaks}
            longBreaks={summary.longBreaks}
            longBreakReasons={summary.longBreakReasons}
          />
          <CheckInSummarySection summaries={summary.checkInSummaries} />
        </>
      )}
    </div>
  )
}
