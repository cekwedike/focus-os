import { useState } from 'react'
import { ChatInputBar } from '@renderer/chat/ChatInputBar'
import { ChatThread } from '@renderer/chat/ChatThread'
import { useProactiveGreeting } from '@renderer/chat/hooks/useProactiveGreeting'
import { useChatContext } from '@renderer/context/ChatContext'
import { DayPanelDrawer } from './DayPanelDrawer'

export function ChatPanel(): React.JSX.Element {
  const {
    initialized,
    greetingComplete,
    setGreetingComplete,
    deliverAssistantMessages,
  } = useChatContext()
  const [dayPanelOpen, setDayPanelOpen] = useState(false)

  useProactiveGreeting({
    initialized,
    greetingComplete,
    setGreetingComplete,
    deliverAssistantMessages,
  })

  return (
    <div className="relative flex min-h-0 min-w-[20rem] flex-1 flex-col">
      <div className="shrink-0 border-b border-surface-border/80 px-3 py-3 sm:px-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="focus-kicker">Command interface</p>
            <h1 className="font-display text-xl font-bold text-text-primary sm:text-2xl">
              Focus Assistant
            </h1>
            <p className="mt-1 hidden text-sm text-text-muted sm:block">
              Type naturally to manage your day. Try &quot;what&apos;s next&quot;, &quot;extend by
              5&quot;, or /menu.
            </p>
          </div>
          <button
            type="button"
            className="focus-btn-ghost shrink-0 text-xs xl:hidden"
            onClick={() => setDayPanelOpen(true)}
          >
            Day
          </button>
        </div>
      </div>
      <ChatThread />
      <ChatInputBar />
      <DayPanelDrawer open={dayPanelOpen} onClose={() => setDayPanelOpen(false)} />
    </div>
  )
}
