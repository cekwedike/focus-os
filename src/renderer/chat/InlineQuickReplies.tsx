interface InlineQuickRepliesProps {
  chips: Array<{ label: string; sendText: string }>
  disabled?: boolean
  onSelect: (text: string) => void
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
          key={`${chip.label}-${chip.sendText}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip.sendText)}
          className="focus-chip disabled:cursor-not-allowed disabled:opacity-50"
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
