import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'
import { useJournal } from './hooks/useJournal'
import { TodayEntrySection } from './components/TodayEntrySection'
import { StreakDisplay } from './components/StreakDisplay'
import { HistoryList } from './components/HistoryList'
import { JournalStatsPanel } from './components/JournalStatsPanel'

const screen = getScreenDefinition('/journal')

export function JournalScreen(): React.JSX.Element {
  const {
    today,
    todayEntry,
    history,
    stats,
    search,
    setSearch,
    loading,
    error,
    saveTodayEntry,
  } = useJournal()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ScreenCard title={screen.title} description={screen.description} />
      {loading && <p className="text-sm text-text-muted">Loading journal...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
      {stats && (
        <>
          <StreakDisplay
            currentStreak={stats.currentStreak}
            longestStreak={stats.longestStreak}
          />
          <JournalStatsPanel
            entriesThisMonth={stats.entriesThisMonth}
            longestStreak={stats.longestStreak}
            totalWordCount={stats.totalWordCount}
          />
        </>
      )}
      <TodayEntrySection today={today} entry={todayEntry} onSave={saveTodayEntry} />
      <HistoryList entries={history} search={search} onSearchChange={setSearch} />
    </div>
  )
}
