import { ChatPanel } from './components/ChatPanel'
import { DayPanel } from './components/DayPanel'

export function HomeDashboardScreen(): React.JSX.Element {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <ChatPanel />
      <div className="day-panel-shell hidden min-h-0 min-w-0 shrink-0 xl:flex xl:w-[clamp(16rem,30vw,24rem)]">
        <DayPanel />
      </div>
    </div>
  )
}
