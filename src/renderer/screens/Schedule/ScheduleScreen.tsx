import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'

const screen = getScreenDefinition('/schedule')

export function ScheduleScreen(): React.JSX.Element {
  return <ScreenCard title={screen.title} description={screen.description} />
}
