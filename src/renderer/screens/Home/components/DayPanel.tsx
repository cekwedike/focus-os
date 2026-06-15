import { RightNowCard } from '@renderer/screens/Dashboard/components/RightNowCard'
import { UpNextCard } from '@renderer/screens/Dashboard/components/UpNextCard'
import { FocusScoreWidget } from '@renderer/screens/Dashboard/components/FocusScoreWidget'
import { FaithStreakWidget } from '@renderer/screens/Dashboard/components/FaithStreakWidget'
import { UntilBreakCountdown } from '@renderer/screens/Dashboard/components/UntilBreakCountdown'
import { StalenessAlertList } from '@renderer/screens/Dashboard/components/StalenessAlertList'

export function DayPanel(): React.JSX.Element {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto border-l border-surface-border/80 bg-surface-card/30 p-4">
      <RightNowCard />
      <UpNextCard />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <FocusScoreWidget />
        <FaithStreakWidget />
      </div>
      <UntilBreakCountdown />
      <StalenessAlertList />
    </aside>
  )
}
