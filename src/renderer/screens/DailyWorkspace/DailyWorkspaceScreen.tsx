import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'

const screen = getScreenDefinition('/daily-workspace')

export function DailyWorkspaceScreen(): React.JSX.Element {
  return <ScreenCard title={screen.title} description={screen.description} />
}
