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
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.label}-${chip.actionId ?? chip.sendText ?? chip.label}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip)}
          className="focus-chip disabled:cursor-not-allowed disabled:opacity-50"
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
