import { useState } from 'react'
import { FormField } from '@renderer/components/ui/FormField'
import { TextInput } from '@renderer/components/ui/TextInput'

interface OpenRouterKeyFieldProps {
  configured: boolean
  onConfiguredChange: (configured: boolean) => void
}

export function OpenRouterKeyField({
  configured,
  onConfiguredChange,
}: OpenRouterKeyFieldProps): React.JSX.Element {
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (): Promise<void> => {
    setError(null)
    if (!apiKey.trim()) {
      setError('Paste your API key first.')
      return
    }
    setSaving(true)
    try {
      const result = await window.focusOS.settings.setOpenRouterKey({ apiKey })
      onConfiguredChange(result.configured)
      setApiKey('')
    } catch (saveError) {
      setError(String(saveError))
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async (): Promise<void> => {
    setSaving(true)
    try {
      const result = await window.focusOS.settings.clearOpenRouterKey()
      onConfiguredChange(result.configured)
      setApiKey('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2 focus-panel/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-text-primary">Cloud AI API Key</span>
        <span className={`focus-badge ${configured ? 'focus-badge-mint' : ''}`}>
          {configured ? 'Saved' : 'Not set up'}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-text-muted">
        Optional. Stored privately on this computer, or loaded from `.env` as `OPENROUTER_API_KEY` during
        development. Focus OS never shows the full key again after you save it here.
      </p>
      <FormField label="Paste A New Key" hint="Leave blank to keep your current key">
        <TextInput
          type="password"
          value={apiKey}
          onChange={setApiKey}
          placeholder="Starts with sk-or-..."
        />
      </FormField>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="focus-btn-primary disabled:opacity-50"
        >
          Save Key
        </button>
        {configured && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleClear()}
            className="focus-btn-ghost disabled:opacity-50"
          >
            Remove Key
          </button>
        )}
      </div>
    </div>
  )
}
