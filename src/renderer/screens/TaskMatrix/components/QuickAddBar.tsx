import { useState } from 'react'

interface QuickAddBarProps {
  onSubmit: (value: string) => Promise<void>
}

export function QuickAddBar({ onSubmit }: QuickAddBarProps): React.JSX.Element {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (): Promise<void> => {
    if (!value.trim()) {
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(value.trim())
      setValue('')
    } catch (submitError) {
      setError(String(submitError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-button border border-surface-border bg-surface-card p-4">
      <label className="mb-2 block text-sm font-medium text-text-primary">Quick Add</label>
      <p className="mb-3 text-xs text-text-muted">
        Try: &quot;Write proposal for Acme 2h by Friday&quot; or &quot;Review emails 30 min tomorrow&quot;
      </p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void handleSubmit()
            }
          }}
          placeholder="Describe a task in plain language..."
          className="flex-1 rounded-button border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-mint/60"
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSubmit()}
          className="rounded-button bg-accent-mint/20 px-4 py-2 text-sm font-medium text-accent-mint disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add Task'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
