import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { SuggestionChip } from '@shared/chat/suggestionChips'
import {
  getSuggestionChips,
  resolveSuggestionChipState,
} from '@shared/chat/suggestionChips'
import { isGreetingSentThisSession } from '@shared/chat/proactiveGreetingSession'
import { useAssistantDelivery } from '@renderer/chat/hooks/useAssistantDelivery'
import { useChatOrchestrator } from '@renderer/chat/hooks/useChatOrchestrator'
import { useChatSession } from '@renderer/chat/hooks/useChatSession'
import { useScheduleContext } from '@renderer/context/ScheduleContext'

interface ChatContextValue {
  messages: ReturnType<typeof useChatSession>['messages']
  sendMessage: (text: string) => Promise<void>
  sending: boolean
  initialized: boolean
  isTyping: boolean
  suggestionChips: SuggestionChip[]
  greetingComplete: boolean
  deliverAssistantMessages: (messages: string[]) => Promise<void>
  setGreetingComplete: (complete: boolean) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { messages, appendAssistantMessage, appendUserMessage } = useChatSession()
  const { isTyping, deliverAssistantMessage, deliverAssistantMessages } =
    useAssistantDelivery(appendAssistantMessage)
  const [sending, setSending] = useState(false)
  const [greetingComplete, setGreetingComplete] = useState(() => isGreetingSentThisSession())
  const { dayBundle } = useScheduleContext()

  const {
    processMessage,
    initialized,
    pendingWakePrompt,
    longBreakActive,
  } = useChatOrchestrator({
    deliverAssistantMessage,
  })

  useEffect(() => {
    const unsubscribe = window.focusOS.onAssistantMessage((payload) => {
      void deliverAssistantMessage(payload.text)
    })
    return unsubscribe
  }, [deliverAssistantMessage])

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim()
      if (!trimmed || sending || isTyping) {
        return
      }
      appendUserMessage(trimmed)
      setSending(true)
      try {
        await processMessage(trimmed)
      } finally {
        setSending(false)
      }
    },
    [appendUserMessage, processMessage, sending, isTyping]
  )

  const suggestionChips = useMemo(() => {
    const state = resolveSuggestionChipState({
      wakeTimeLogged: !pendingWakePrompt,
      hasSchedule: (dayBundle?.blocks.length ?? 0) > 0,
      longBreakActive,
      isTyping,
      greetingComplete,
    })
    return getSuggestionChips({
      state,
      isTyping,
      greetingComplete,
    })
  }, [
    pendingWakePrompt,
    dayBundle?.blocks.length,
    longBreakActive,
    isTyping,
    greetingComplete,
  ])

  const value = useMemo(
    () => ({
      messages,
      sendMessage,
      sending,
      initialized,
      isTyping,
      suggestionChips,
      greetingComplete,
      deliverAssistantMessages,
      setGreetingComplete,
    }),
    [
      messages,
      sendMessage,
      sending,
      initialized,
      isTyping,
      suggestionChips,
      greetingComplete,
      deliverAssistantMessages,
    ]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}
