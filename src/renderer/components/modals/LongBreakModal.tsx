import { useBreakContext } from '@renderer/context/BreakContext'
import { FormField } from '@renderer/components/ui/FormField'
import { NumberInput } from '@renderer/components/ui/NumberInput'
import { TextInput } from '@renderer/components/ui/TextInput'
import { useState } from 'react'

export function LongBreakModal(): React.JSX.Element | null {
  const { showLongBreakModal, closeLongBreakModal, startLongBreak } = useBreakContext()
  const [reason, setReason] = useState('')
  const [plannedMinutes, setPlannedMinutes] = useState(30)
  const [saving, setSaving] = useState(false)

  if (!showLongBreakModal) {
    return null
  }

  const handleStart = async (): Promise<void> => {
    setSaving(true)
    try {
      await startLongBreak(reason.trim() || 'Long break', plannedMinutes)
      setReason('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="focus-modal-backdrop">
      <div className="focus-modal">
        <h3 className="font-display text-lg font-semibold text-text-primary">Take A Long Break</h3>
        <div className="mt-4 space-y-3">
          <FormField label="Reason">
            <TextInput value={reason} onChange={setReason} placeholder="Why are you stepping away?" />
          </FormField>
          <FormField label="Expected Duration (Minutes)">
            <NumberInput value={plannedMinutes} min={5} onChange={setPlannedMinutes} />
          </FormField>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeLongBreakModal}
            className="focus-btn-ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleStart()}
            className="focus-btn-primary"
          >
            Start Break
          </button>
        </div>
      </div>
    </div>
  )
}
