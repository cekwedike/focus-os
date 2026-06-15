import { FormField } from '@renderer/components/ui/FormField'
import { TextInput } from '@renderer/components/ui/TextInput'
import { useEffect, useState } from 'react'

interface FaithEntryModalProps {
  open: boolean
  blockId?: number
  entryDate?: string
  initialReference?: string
  initialNotes?: string
  onClose: () => void
  onComplete?: () => Promise<void>
}

export function FaithEntryModal({
  open,
  blockId,
  entryDate,
  initialReference = '',
  initialNotes = '',
  onClose,
  onComplete,
}: FaithEntryModalProps): React.JSX.Element | null {
  const [bibleReference, setBibleReference] = useState(initialReference)
  const [prayerNotes, setPrayerNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setBibleReference(initialReference)
      setPrayerNotes(initialNotes)
    }
  }, [open, initialReference, initialNotes])

  if (!open) {
    return null
  }

  const handleSubmit = async (): Promise<void> => {
    if (!bibleReference.trim()) {
      return
    }

    setSaving(true)
    try {
      if (blockId) {
        await window.focusOS.journal.completeFaithBlock({
          blockId,
          bible_reference: bibleReference,
          prayer_notes: prayerNotes || null,
        })
      } else if (entryDate) {
        await window.focusOS.journal.upsert({
          entry_date: entryDate,
          bible_reference: bibleReference,
          prayer_notes: prayerNotes || null,
        })
      }
      await onComplete?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="focus-modal-backdrop">
      <div className="focus-modal">
        <h3 className="font-display text-lg font-semibold text-text-primary">Log Faith Time</h3>
        <p className="mt-1 text-sm text-text-muted">
          Record your reading and prayer notes, then mark the faith block complete.
        </p>
        <div className="mt-4 space-y-3">
          <FormField label="Bible Reading Reference" hint="Required">
            <TextInput
              value={bibleReference}
              onChange={setBibleReference}
              placeholder="e.g. Psalm 23"
            />
          </FormField>
          <FormField label="Prayer Notes">
            <textarea
              value={prayerNotes}
              onChange={(event) => setPrayerNotes(event.target.value)}
              rows={5}
              placeholder="Optional prayer notes"
              className="focus-input"
            />
          </FormField>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-btn-ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !bibleReference.trim()}
            onClick={() => void handleSubmit()}
            className="focus-btn-primary disabled:opacity-50"
          >
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  )
}
