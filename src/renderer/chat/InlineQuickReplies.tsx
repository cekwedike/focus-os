import type { QuickReplyChip } from '@shared/types/chat'

interface InlineQuickRepliesProps {
  chips: QuickReplyChip[]
  disabled?: boolean
  onSelect: (chip: QuickReplyChip) => void
}

export function InlineQuickReplies({
  chips,
  disabled = false,
  onSelect,
}: InlineQuickRepliesProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2 pl-1">
      {chips.map((chip) => (
        <button
          key={`${chip.label}-${chip.actionId ?? chip.sendText ?? chip.label}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip)}
          className="rounded-full border border-accent-mint/30 bg-accent-mint/10 px-3.5 py-1.5 text-sm font-medium text-accent-mint transition hover:bg-accent-mint/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
