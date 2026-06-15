import { ChatInputBar } from './ChatInputBar'
import { ChatThread } from './ChatThread'

export function ChatShell(): React.JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-surface-border/80 px-4 py-3 md:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="focus-kicker">Command interface</p>
          <h1 className="font-display text-2xl font-bold text-text-primary">Focus Assistant</h1>
          <p className="mt-1 text-sm text-text-muted">
            Type naturally to manage your day. Try &quot;what&apos;s next&quot;, &quot;add task for Acme&quot;, or /menu.
          </p>
        </div>
      </div>
      <ChatThread />
      <ChatInputBar />
    </div>
  )
}
