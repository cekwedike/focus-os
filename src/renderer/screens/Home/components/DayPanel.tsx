import { RightNowCard } from '@renderer/screens/Dashboard/components/RightNowCard'
import { UpNextCard } from '@renderer/screens/Dashboard/components/UpNextCard'
import { FocusScoreWidget } from '@renderer/screens/Dashboard/components/FocusScoreWidget'
import { FaithStreakWidget } from '@renderer/screens/Dashboard/components/FaithStreakWidget'
import { UntilBreakCountdown } from '@renderer/screens/Dashboard/components/UntilBreakCountdown'
import { StalenessAlertList } from '@renderer/screens/Dashboard/components/StalenessAlertList'

export function DayPanel(): React.JSX.Element {
  return (
    <aside className="day-panel flex h-full min-h-0 min-w-0 w-full flex-col gap-4 overflow-y-auto overflow-x-hidden border-l border-surface-border/80 bg-surface-card/30 p-3 sm:p-4">
      <RightNowCard variant="sidebar" />
      <UpNextCard variant="sidebar" />
      <div className="grid min-w-0 grid-cols-1 gap-4">
        <FocusScoreWidget variant="sidebar" />
        <FaithStreakWidget variant="sidebar" />
      </div>
      <UntilBreakCountdown variant="sidebar" />
      <StalenessAlertList variant="sidebar" />
    </aside>
  )
}
