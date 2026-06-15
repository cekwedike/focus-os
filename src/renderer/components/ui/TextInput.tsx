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
      className="focus-input disabled:opacity-50"
    />
  )
}
