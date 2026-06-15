import { ChatPanel } from './components/ChatPanel'
import { DayPanel } from './components/DayPanel'

export function HomeDashboardScreen(): React.JSX.Element {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <ChatPanel />
      <div className="hidden w-80 shrink-0 lg:block xl:w-96">
        <DayPanel />
      </div>
    </div>
  )
}
