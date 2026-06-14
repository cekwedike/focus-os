interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'password' | 'url'
  disabled?: boolean
  onBlur?: () => void
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  onBlur,
}: TextInputProps): React.JSX.Element {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      className="w-full rounded-button border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-mint/60 disabled:opacity-50"
    />
  )
}
