import { useEffect, useState } from 'react'
import type { ClientProjectRow, CreateClientProjectInput } from '@shared/types/db'
import { ColorPicker } from '@renderer/components/ui/ColorPicker'
import { FormField } from '@renderer/components/ui/FormField'
import { NumberInput } from '@renderer/components/ui/NumberInput'
import { TextInput } from '@renderer/components/ui/TextInput'
import { TimeInput } from '@renderer/components/ui/TimeInput'
import { Toggle } from '@renderer/components/ui/Toggle'

export interface ClientProjectFormValues {
  name: string
  color: string
  weight_percent: number
  is_active: boolean
  fixed_block_enabled: boolean
  fixed_block_start: string
  fixed_block_duration_minutes: number
}

const DEFAULT_VALUES: ClientProjectFormValues = {
  name: '',
  color: '#2DD4A0',
  weight_percent: 0,
  is_active: true,
  fixed_block_enabled: false,
  fixed_block_start: '09:00',
  fixed_block_duration_minutes: 60,
}

interface ClientProjectFormProps {
  initial?: ClientProjectRow | null
  onSubmit: (values: CreateClientProjectInput & { id?: number }) => Promise<void>
  onCancel: () => void
}

export function ClientProjectForm({
  initial,
  onSubmit,
  onCancel,
}: ClientProjectFormProps): React.JSX.Element {
  const [values, setValues] = useState<ClientProjectFormValues>(DEFAULT_VALUES)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setValues({
        name: initial.name,
        color: initial.color,
        weight_percent: initial.weight_percent,
        is_active: initial.is_active === 1,
        fixed_block_enabled: initial.fixed_block_enabled === 1,
        fixed_block_start: initial.fixed_block_start ?? '09:00',
        fixed_block_duration_minutes: initial.fixed_block_duration_minutes ?? 60,
      })
    } else {
      setValues(DEFAULT_VALUES)
    }
  }, [initial])

  const handleSubmit = async (): Promise<void> => {
    setError(null)
    if (!values.name.trim()) {
      setError('Name is required')
      return
    }
    if (values.fixed_block_enabled && (!values.fixed_block_start || values.fixed_block_duration_minutes <= 0)) {
      setError('Pick a start time and how long this block should last.')
      return
    }

    setSaving(true)
    try {
      await onSubmit({
        id: initial?.id,
        name: values.name.trim(),
        color: values.color,
        weight_percent: values.weight_percent,
        is_active: values.is_active,
        fixed_block_enabled: values.fixed_block_enabled,
        fixed_block_start: values.fixed_block_enabled ? values.fixed_block_start : null,
        fixed_block_duration_minutes: values.fixed_block_enabled
          ? values.fixed_block_duration_minutes
          : null,
      })
    } catch (submitError) {
      setError(String(submitError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <FormField label="Client Or Project Name">
        <TextInput value={values.name} onChange={(name) => setValues({ ...values, name })} />
      </FormField>
      <FormField label="Color On Your Schedule">
        <ColorPicker value={values.color} onChange={(color) => setValues({ ...values, color })} />
      </FormField>
      <FormField
        label="Share Of Flexible Work Time (%)"
        hint="All active clients should add up to 100%"
      >
        <NumberInput
          value={values.weight_percent}
          min={0}
          max={100}
          onChange={(weight_percent) => setValues({ ...values, weight_percent })}
        />
      </FormField>
      <Toggle
        label="Include In My Schedule"
        checked={values.is_active}
        onChange={(is_active) => setValues({ ...values, is_active })}
        showState
      />
      <Toggle
        label="Same Time Every Day"
        checked={values.fixed_block_enabled}
        onChange={(fixed_block_enabled) => setValues({ ...values, fixed_block_enabled })}
        showState
      />
      {values.fixed_block_enabled && (
        <>
          <FormField label="Starts At">
            <TimeInput
              value={values.fixed_block_start}
              onChange={(fixed_block_start) => setValues({ ...values, fixed_block_start })}
            />
          </FormField>
          <FormField label="How Long (Minutes)">
            <NumberInput
              value={values.fixed_block_duration_minutes}
              min={1}
              onChange={(fixed_block_duration_minutes) =>
                setValues({ ...values, fixed_block_duration_minutes })
              }
            />
          </FormField>
        </>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="focus-btn-ghost"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSubmit()}
          className="focus-btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : initial ? 'Save Changes' : 'Add Client'}
        </button>
      </div>
    </div>
  )
}
