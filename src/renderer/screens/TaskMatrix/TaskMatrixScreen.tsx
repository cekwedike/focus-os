import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'

const screen = getScreenDefinition('/task-matrix')

export function TaskMatrixScreen(): React.JSX.Element {
  return <ScreenCard title={screen.title} description={screen.description} />
}
