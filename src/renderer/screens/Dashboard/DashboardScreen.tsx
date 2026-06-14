import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'

const screen = getScreenDefinition('/')

export function DashboardScreen(): React.JSX.Element {
  return <ScreenCard title={screen.title} description={screen.description} />
}
