import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'

const screen = getScreenDefinition('/daily-insight')

export function DailyInsightScreen(): React.JSX.Element {
  return <ScreenCard title={screen.title} description={screen.description} />
}
