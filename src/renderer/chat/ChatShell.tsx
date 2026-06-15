import { ChatInputBar } from './ChatInputBar'
import { ChatThread } from './ChatThread'
import { SuggestionChips } from './SuggestionChips'
import { useProactiveGreeting } from './hooks/useProactiveGreeting'
import { useChatContext } from '@renderer/context/ChatContext'

export function ChatShell(): React.JSX.Element {
  const {
    initialized,
    greetingComplete,
    setGreetingComplete,
    deliverAssistantMessages,
    suggestionChips,
    sendMessage,
    sending,
    isTyping,
  } = useChatContext()

  useProactiveGreeting({
    initialized,
    greetingComplete,
    setGreetingComplete,
    deliverAssistantMessages,
  })

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-surface-border/80 px-3 py-3 sm:px-4 md:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <p className="focus-kicker">Command interface</p>
          <h1 className="font-display text-xl font-bold text-text-primary sm:text-2xl">Focus Assistant</h1>
          <p className="mt-1 hidden text-sm text-text-muted sm:block">
            Type naturally to manage your day. Try &quot;what&apos;s next&quot;, &quot;add task for Acme&quot;, or /menu.
          </p>
        </div>
      </div>
      <ChatThread />
      <SuggestionChips
        chips={suggestionChips}
        disabled={sending || isTyping}
        onSelect={(text) => void sendMessage(text)}
      />
      <ChatInputBar />
    </div>
  )
}
