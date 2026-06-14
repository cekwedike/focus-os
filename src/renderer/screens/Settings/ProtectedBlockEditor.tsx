import { useState } from 'react'
import type { ProtectedAnchorType, ProtectedBlockRow } from '@shared/types/db'
import { FormField } from '@renderer/components/ui/FormField'
import { NumberInput } from '@renderer/components/ui/NumberInput'
import { TextInput } from '@renderer/components/ui/TextInput'
import { TimeInput } from '@renderer/components/ui/TimeInput'
import { Toggle } from '@renderer/components/ui/Toggle'
import {
  PROTECTED_BLOCK_HEADINGS,
  PROTECTED_BLOCK_HINTS,
  SCHEDULE_TIMING_OPTIONS,
  scheduleTimingDetailLabel,
} from './settingsCopy'

interface ProtectedBlockEditorProps {
  block: ProtectedBlockRow
  onSave: (block: ProtectedBlockRow) => Promise<void>
}

export function ProtectedBlockEditor({
  block,
  onSave,
}: ProtectedBlockEditorProps): React.JSX.Element {
  const [label, setLabel] = useState(block.label)
  const [duration, setDuration] = useState(block.duration_minutes)
  const [anchorType, setAnchorType] = useState<ProtectedAnchorType>(block.anchor_type)
  const [anchorValue, setAnchorValue] = useState(block.anchor_value)
  const [enabled, setEnabled] = useState(block.is_enabled === 1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const heading = PROTECTED_BLOCK_HEADINGS[block.block_type]
  const hint = PROTECTED_BLOCK_HINTS[block.block_type]

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await window.focusOS.protectedBlocks.update({
        id: block.id,
        label: label.trim(),
        duration_minutes: duration,
        anchor_type: anchorType,
        anchor_value: anchorValue,
        is_enabled: enabled,
      })
      await onSave(updated)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="rounded-button border border-surface-border bg-surface-elevated p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-medium text-text-primary">{heading}</h4>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">{hint}</p>
        </div>
        <Toggle
          label="Include In My Day"
          checked={enabled}
          onChange={setEnabled}
          showState
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FormField label="Name On Your Schedule" hint="You can rename this if you like">
          <TextInput value={label} onChange={setLabel} />
        </FormField>
        <FormField label="How Long (Minutes)">
          <NumberInput value={duration} min={1} onChange={setDuration} />
        </FormField>
        <FormField label="When Does This Happen?">
          <select
            value={anchorType}
            onChange={(event) => setAnchorType(event.target.value as ProtectedAnchorType)}
            className="w-full rounded-button border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
          >
            {SCHEDULE_TIMING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={scheduleTimingDetailLabel(anchorType)}>
          {anchorType === 'fixed_time' ? (
            <TimeInput value={anchorValue} onChange={setAnchorValue} />
          ) : (
            <NumberInput
              value={Number(anchorValue) || 0}
              min={0}
              onChange={(value) => setAnchorValue(String(value))}
            />
          )}
        </FormField>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-button bg-accent-mint/20 px-4 py-2 text-sm font-medium text-accent-mint hover:bg-accent-mint/30 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && !saving && (
          <span className="text-xs text-accent-mint">Saved</span>
        )}
      </div>
    </article>
  )
}
