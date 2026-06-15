import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChatInputBar } from '@renderer/chat/ChatInputBar'
import { ChatThread } from '@renderer/chat/ChatThread'
import { useProactiveGreeting } from '@renderer/chat/hooks/useProactiveGreeting'
import { useChatContext } from '@renderer/context/ChatContext'
import { JarvisWaveform } from '../jarvis/JarvisWaveform'
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
  } = useChatContext()
  const [dayPanelOpen, setDayPanelOpen] = useState(false)

  useProactiveGreeting({
    initialized,
    greetingComplete,
    setGreetingComplete,
    deliverAssistantMessages,
  })

  const systemActive = initialized && (aiThinking || isTyping)

  return (
    <div className="jarvis-command-frame relative flex min-h-0 min-w-[18rem] flex-1 flex-col overflow-hidden">
      <div className="jarvis-scanline" aria-hidden="true" />
      <span className="jarvis-corner-bracket jarvis-corner-tl" aria-hidden="true" />
      <span className="jarvis-corner-bracket jarvis-corner-tr" aria-hidden="true" />

      <header className="relative z-10 shrink-0 border-b border-accent-cyan/15 px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="jarvis-kicker">Neural command interface</p>
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              <span className="text-gradient-mint">Focus</span>
              <span className="text-text-primary"> Assistant</span>
            </h1>
            <p className="mt-1 hidden max-w-md text-xs text-text-muted sm:block">
              Voice or type — &quot;what&apos;s next&quot;, &quot;extend by 5&quot;, /menu
            </p>
          </motion.div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <JarvisWaveform active={systemActive} className="hidden sm:flex" />
            <button
              type="button"
              className="focus-btn-ghost text-xs lg:hidden"
              onClick={() => setDayPanelOpen(true)}
            >
              HUD
            </button>
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
