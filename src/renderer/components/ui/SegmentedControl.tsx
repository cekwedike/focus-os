interface SegmentedControlOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: Array<SegmentedControlOption<T>>
  onChange: (value: T) => void
  disabled?: boolean
  ariaLabel: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex w-full gap-1 rounded-button border border-surface-border bg-surface p-1"
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={isActive}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => {
              if (option.value !== value) {
                onChange(option.value)
              }
            }}
            className={`flex-1 rounded-button px-3 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50 ${
              isActive
                ? 'bg-accent-mint text-surface shadow-md ring-2 ring-accent-mint/80 ring-offset-2 ring-offset-surface'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-card hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
