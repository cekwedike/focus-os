import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'
import { FaithStreakWidget } from './components/FaithStreakWidget'
import { FocusScoreWidget } from './components/FocusScoreWidget'
import { RightNowCard } from './components/RightNowCard'
import { StalenessAlertList } from './components/StalenessAlertList'
import { UntilBreakCountdown } from './components/UntilBreakCountdown'
import { UpNextCard } from './components/UpNextCard'

const screen = getScreenDefinition('/')

export function DashboardScreen(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ScreenCard title={screen.title} description={screen.description} />
      <div className="grid gap-4 md:grid-cols-2">
        <RightNowCard />
        <UpNextCard />
        <FocusScoreWidget />
        <FaithStreakWidget />
        <UntilBreakCountdown />
        <StalenessAlertList />
      </div>
    </div>
  )
}
