import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'

const screen = getScreenDefinition('/journal')

export function JournalScreen(): React.JSX.Element {
  return <ScreenCard title={screen.title} description={screen.description} />
}
