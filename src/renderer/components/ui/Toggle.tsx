interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  showState?: boolean
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  showState = false,
}: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-text-primary">{label}</span>
      <div className="flex items-center gap-2">
        {showState && (
          <span className="text-xs font-medium text-text-muted">{checked ? 'On' : 'Off'}</span>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={`${label}: ${checked ? 'on' : 'off'}`}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-mint/50 ${
            checked ? 'bg-accent-mint' : 'bg-surface-border'
          } disabled:opacity-50`}
        >
          <span
            aria-hidden
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
