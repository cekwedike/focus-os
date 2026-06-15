import { ChatPanel } from './components/ChatPanel'
import { DayPanel } from './components/DayPanel'

export function HomeDashboardScreen(): React.JSX.Element {
  return (
    <div className="jarvis-command-deck flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatPanel />
      </div>
      <div className="day-panel-shell hidden min-h-0 min-w-0 shrink-0 lg:flex lg:w-[min(44vw,480px)] xl:w-[min(40vw,520px)] 2xl:w-[min(36vw,560px)]">
        <DayPanel />
      </div>
    </div>
  )
}
