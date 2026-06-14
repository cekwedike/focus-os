import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'

const screen = getScreenDefinition('/review')

export function ReviewScreen(): React.JSX.Element {
  return <ScreenCard title={screen.title} description={screen.description} />
}
