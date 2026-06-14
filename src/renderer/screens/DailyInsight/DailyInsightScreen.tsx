import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'
import { useDailyInsight } from './hooks/useDailyInsight'
import { InsightBriefing } from './components/InsightBriefing'
import { RawSnapshotPanel } from './components/RawSnapshotPanel'
import { InsightHistoryList } from './components/InsightHistoryList'

const screen = getScreenDefinition('/daily-insight')

export function DailyInsightScreen(): React.JSX.Element {
  const { todayInsight, history, loading, generating, error, refreshToday } = useDailyInsight()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ScreenCard title={screen.title} description={screen.description} />
      <div className="flex justify-end">
        <button
          type="button"
          disabled={loading || generating}
          onClick={() => void refreshToday()}
          className="rounded-button bg-accent-mint/20 px-4 py-2 text-sm font-medium text-accent-mint disabled:opacity-50"
        >
          {generating ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {loading && <p className="text-sm text-text-muted">Loading today&apos;s insight...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
      {todayInsight && todayInsight.source === 'none' ? (
        <RawSnapshotPanel content={todayInsight.content_markdown} />
      ) : null}
      {todayInsight && todayInsight.source !== 'none' ? (
        <InsightBriefing content={todayInsight.content_markdown} source={todayInsight.source} />
      ) : null}
      {todayInsight ? <InsightHistoryList entries={history} /> : null}
    </div>
  )
}
