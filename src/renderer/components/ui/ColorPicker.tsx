const PALETTE = ['#2DD4A0', '#6C8EF5', '#3B82F6', '#F59E0B', '#EF4444', '#A78BFA', '#EC4899']

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Select color ${color}`}
            onClick={() => onChange(color)}
            className={`h-8 w-8 rounded-full border-2 ${
              value.toUpperCase() === color.toUpperCase()
                ? 'border-white'
                : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="#2DD4A0"
        className="focus-input"
      />
    </div>
  )
}
