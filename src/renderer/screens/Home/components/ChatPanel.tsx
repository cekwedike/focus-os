import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChatInputBar } from '@renderer/chat/ChatInputBar'
import { ChatThread } from '@renderer/chat/ChatThread'
import { useProactiveGreeting } from '@renderer/chat/hooks/useProactiveGreeting'
import { useChatContext } from '@renderer/context/ChatContext'
import { HudWaveform } from '../jarvis/HudWaveform'
import { HudScanline } from '../jarvis/HudScanline'
import { DayPanelDrawer } from './DayPanelDrawer'
import '../jarvis/jarvis.css'

export function ChatPanel(): React.JSX.Element {
  const {
    initialized,
    greetingComplete,
    setGreetingComplete,
    deliverAssistantMessages,
    aiThinking,
    isTyping,
    sending,
    messages,
    clearChat,
  } = useChatContext()
  const [dayPanelOpen, setDayPanelOpen] = useState(false)

  const handleClearChat = (): void => {
    if (sending || isTyping || aiThinking) {
      return
    }
    if (messages.length > 0) {
      const confirmed = window.confirm('Clear this conversation? This cannot be undone.')
      if (!confirmed) {
        return
      }
    }
    clearChat()
  }

  useProactiveGreeting({
    initialized,
    greetingComplete,
    setGreetingComplete,
    deliverAssistantMessages,
  })

  const systemActive = initialized && (aiThinking || isTyping)

  return (
    <div className="hud-command-frame relative flex min-h-0 min-w-[18rem] flex-1 flex-col overflow-hidden">
      <HudScanline />
      <span className="hud-corner-bracket hud-corner-tl" aria-hidden="true" />
      <span className="hud-corner-bracket hud-corner-tr" aria-hidden="true" />

      <header className="relative z-10 shrink-0 border-b border-accent-cyan/15 px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="hud-kicker">Command interface</p>
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              <span className="text-gradient-mint">Focus</span>
              <span className="text-text-primary"> Assistant</span>
            </h1>
            <p className="mt-1 hidden max-w-md text-xs text-text-muted sm:block">
              Voice or type — &quot;what&apos;s next&quot;, &quot;extend by 5&quot;, /menu
            </p>
          </motion.div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <HudWaveform active={systemActive || initialized} className="hidden sm:flex" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="focus-btn-ghost text-xs"
                onClick={handleClearChat}
                disabled={sending || isTyping || aiThinking}
                title="Clear conversation"
              >
                Clear
              </button>
              <button
                type="button"
                className="focus-btn-ghost text-xs lg:hidden"
                onClick={() => setDayPanelOpen(true)}
              >
                Telemetry
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <ChatThread />
        <ChatInputBar />
      </div>

      <DayPanelDrawer open={dayPanelOpen} onClose={() => setDayPanelOpen(false)} />
    </div>
  )
}
