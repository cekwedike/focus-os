import type { SuggestionChip } from '@shared/chat/suggestionChips'

interface SuggestionChipsProps {
  chips: SuggestionChip[]
  disabled?: boolean
  onSelect: (sendText: string) => void
}

export function SuggestionChips({
  chips,
  disabled = false,
  onSelect,
}: SuggestionChipsProps): React.JSX.Element | null {
  if (chips.length === 0) {
    return null
  }

  return (
    <div className="shrink-0 border-t border-surface-border/60 bg-surface-card/40 px-3 py-2 sm:px-4 md:px-8">
      <div className="mx-auto flex w-full max-w-3xl gap-2 overflow-x-auto pb-1">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(chip.sendText)}
            className="shrink-0 rounded-badge border border-surface-border bg-surface-elevated/60 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent-mint/40 hover:bg-accent-mint/10 hover:text-accent-mint disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  )
}
