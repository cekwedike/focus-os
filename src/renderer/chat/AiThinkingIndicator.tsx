export function AiThinkingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start">
      <div className="rounded-panel border border-surface-border bg-surface-card px-4 py-3 text-sm text-text-muted shadow-panel">
        <p className="focus-kicker mb-1">Assistant</p>
        <div className="flex items-center gap-2">
          <span>Thinking it through</span>
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-mint" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-mint [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-mint [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  )
}
