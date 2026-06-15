import { useEffect, useState } from 'react'
import type { ClientProjectRow, CreateClientProjectInput } from '@shared/types/db'
import { ColorPicker } from '@renderer/components/ui/ColorPicker'
import { DurationInput } from '@renderer/components/ui/DurationInput'
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
  reminder_enabled: boolean
  reminder_interval_minutes: number
  reminder_label: string
}

const DEFAULT_VALUES: ClientProjectFormValues = {
  name: '',
  color: '#2DD4A0',
  weight_percent: 0,
  is_active: true,
  fixed_block_enabled: false,
  fixed_block_start: '',
  fixed_block_duration_minutes: 0,
  reminder_enabled: false,
  reminder_interval_minutes: 0,
  reminder_label: '',
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
        fixed_block_start: initial.fixed_block_start ?? '',
        fixed_block_duration_minutes: initial.fixed_block_duration_minutes ?? 0,
        reminder_enabled: initial.reminder_enabled === 1,
        reminder_interval_minutes: initial.reminder_interval_minutes ?? 0,
        reminder_label: initial.reminder_label ?? '',
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
    if (
      values.fixed_block_enabled &&
      (!values.fixed_block_start || values.fixed_block_duration_minutes <= 0)
    ) {
      setError('Pick a start time and how long this block should last.')
      return
    }
    if (values.reminder_enabled && values.reminder_interval_minutes < 5) {
      setError('Set a reminder interval of at least 5 minutes.')
      return
    }

    const weightPercent = values.fixed_block_enabled ? 0 : values.weight_percent

    setSaving(true)
    try {
      await onSubmit({
        id: initial?.id,
        name: values.name.trim(),
        color: values.color,
        weight_percent: weightPercent,
        is_active: values.is_active,
        fixed_block_enabled: values.fixed_block_enabled,
        fixed_block_start: values.fixed_block_enabled ? values.fixed_block_start : null,
        fixed_block_duration_minutes: values.fixed_block_enabled
          ? values.fixed_block_duration_minutes
          : null,
        reminder_enabled: values.reminder_enabled,
        reminder_interval_minutes: values.reminder_enabled
          ? values.reminder_interval_minutes
          : null,
        reminder_label: values.reminder_enabled
          ? values.reminder_label.trim() || null
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
      {!values.fixed_block_enabled && (
        <FormField
          label="Share of Remaining Work Time (%)"
          hint="How much of your unscheduled hours go to this client, relative to your other flexible clients. All active flexible clients should add up to 100%."
        >
          <NumberInput
            value={values.weight_percent}
            min={0}
            max={100}
            onChange={(weight_percent) => setValues({ ...values, weight_percent })}
          />
        </FormField>
      )}
      <Toggle
        label="Include In My Schedule"
        checked={values.is_active}
        onChange={(is_active) => setValues({ ...values, is_active })}
        showState
      />
      <Toggle
        label="Same Time Every Day"
        checked={values.fixed_block_enabled}
        onChange={(fixed_block_enabled) =>
          setValues({
            ...values,
            fixed_block_enabled,
            weight_percent: fixed_block_enabled ? 0 : values.weight_percent,
          })
        }
        showState
      />
      {values.fixed_block_enabled && (
        <>
          <FormField label="Starts At">
            <TimeInput
              value={values.fixed_block_start}
              allowEmpty={!initial}
              onChange={(fixed_block_start) => setValues({ ...values, fixed_block_start })}
            />
          </FormField>
          <FormField label="How Long">
            <DurationInput
              valueMinutes={values.fixed_block_duration_minutes}
              minTotalMinutes={1}
              onChange={(fixed_block_duration_minutes) =>
                setValues({ ...values, fixed_block_duration_minutes })
              }
            />
          </FormField>
        </>
      )}

      <div className="border-t border-surface-border pt-4">
        <h5 className="mb-3 text-sm font-semibold text-text-primary">
          Recurring Check-ins While Active
        </h5>
        <div className="space-y-4">
          <Toggle
            label="Enable recurring check-ins"
            checked={values.reminder_enabled}
            onChange={(reminder_enabled) => setValues({ ...values, reminder_enabled })}
            showState
          />
          {values.reminder_enabled && (
            <>
              <FormField
                label="How Often"
                hint="While this client's block is active on your schedule"
              >
                <DurationInput
                  valueMinutes={values.reminder_interval_minutes}
                  minTotalMinutes={5}
                  onChange={(reminder_interval_minutes) =>
                    setValues({ ...values, reminder_interval_minutes })
                  }
                />
              </FormField>
              <FormField label="Reminder Label">
                <TextInput
                  value={values.reminder_label}
                  placeholder="Check inbox"
                  onChange={(reminder_label) => setValues({ ...values, reminder_label })}
                />
              </FormField>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="focus-btn-ghost">
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
