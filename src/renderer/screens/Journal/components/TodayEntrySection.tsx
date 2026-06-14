import { FormField } from '@renderer/components/ui/FormField'
import { TextInput } from '@renderer/components/ui/TextInput'
import { useEffect, useState } from 'react'

interface TodayEntrySectionProps {
  today: string
  entry: import('@shared/types/db').FaithLogRow | null
  onSave: (bibleReference: string, prayerNotes: string) => Promise<void>
}

export function TodayEntrySection({
  today,
  entry,
  onSave,
}: TodayEntrySectionProps): React.JSX.Element {
  const [editing, setEditing] = useState(!entry)
  const [bibleReference, setBibleReference] = useState(entry?.bible_reference ?? '')
  const [prayerNotes, setPrayerNotes] = useState(entry?.prayer_notes ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setBibleReference(entry?.bible_reference ?? '')
    setPrayerNotes(entry?.prayer_notes ?? '')
    setEditing(!entry)
  }, [entry])

  const handleSave = async (): Promise<void> => {
    if (!bibleReference.trim()) {
      return
    }
    setSaving(true)
    try {
      await onSave(bibleReference, prayerNotes)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (!editing && entry) {
    return (
      <section className="rounded-button border border-surface-border bg-surface-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Today ({today})</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Reading: <span className="text-text-primary">{entry.bible_reference}</span>
            </p>
            {entry.prayer_notes && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{entry.prayer_notes}</p>
            )}
            <p className="mt-2 text-xs text-text-muted">{entry.word_count} words</p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-button border border-surface-border px-3 py-1.5 text-xs text-text-secondary"
          >
            Edit
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-5">
      <h3 className="text-sm font-semibold text-text-primary">Today ({today})</h3>
      <div className="mt-4 space-y-3">
        <FormField label="Bible Reading Reference" hint="Required to count toward your streak">
          <TextInput
            value={bibleReference}
            onChange={setBibleReference}
            placeholder="e.g. John 3:16-21"
          />
        </FormField>
        <FormField label="Prayer Notes">
          <textarea
            value={prayerNotes}
            onChange={(event) => setPrayerNotes(event.target.value)}
            rows={5}
            placeholder="Optional reflections or prayer notes"
            className="w-full rounded-button border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-mint/60"
          />
        </FormField>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        {entry && (
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setBibleReference(entry.bible_reference ?? '')
              setPrayerNotes(entry.prayer_notes ?? '')
            }}
            className="rounded-button border border-surface-border px-3 py-2 text-sm text-text-secondary"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={saving || !bibleReference.trim()}
          onClick={() => void handleSave()}
          className="rounded-button bg-accent-mint/20 px-3 py-2 text-sm font-medium text-accent-mint disabled:opacity-50"
        >
          Save Entry
        </button>
      </div>
    </section>
  )
}
