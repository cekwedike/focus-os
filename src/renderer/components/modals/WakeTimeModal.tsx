import { useEffect, useState } from 'react'
import { FormField } from '@renderer/components/ui/FormField'
import { NumberInput } from '@renderer/components/ui/NumberInput'
import { TimeInput } from '@renderer/components/ui/TimeInput'
import { getCurrentTimeHHMM } from '@renderer/utils/date'

interface WakeTimeModalProps {
  open: boolean
  defaultSleepTime: string
  defaultCapacityHours: number
  onConfirm: (values: {
    wakeTime: string
    sleepTargetTime: string
    capacityHours: number
  }) => Promise<void>
}

export function WakeTimeModal({
  open,
  defaultSleepTime,
  defaultCapacityHours,
  onConfirm,
}: WakeTimeModalProps): React.JSX.Element | null {
  const [wakeTime, setWakeTime] = useState(getCurrentTimeHHMM)
  const [sleepTargetTime, setSleepTargetTime] = useState(defaultSleepTime)
  const [capacityHours, setCapacityHours] = useState(defaultCapacityHours)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setWakeTime(getCurrentTimeHHMM())
      setSleepTargetTime(defaultSleepTime)
      setCapacityHours(defaultCapacityHours)
    }
  }, [open, defaultSleepTime, defaultCapacityHours])

  if (!open) {
    return null
  }

  const handleConfirm = async (): Promise<void> => {
    setSaving(true)
    try {
      await onConfirm({ wakeTime, sleepTargetTime, capacityHours })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-button border border-surface-border bg-surface-card p-5">
        <h3 className="text-lg font-semibold text-text-primary">Good Morning</h3>
        <p className="mt-2 text-sm text-text-muted">
          Set today&apos;s wake time and day boundaries before planning your schedule.
        </p>
        <div className="mt-4 space-y-3">
          <FormField label="Wake Time">
            <TimeInput value={wakeTime} onChange={setWakeTime} />
          </FormField>
          <FormField label="End Of Day Time">
            <TimeInput value={sleepTargetTime} onChange={setSleepTargetTime} />
          </FormField>
          <FormField label="Total Capacity (Hours)">
            <NumberInput value={capacityHours} min={1} max={16} onChange={setCapacityHours} />
          </FormField>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleConfirm()}
          className="mt-5 w-full rounded-button bg-accent-mint/20 px-4 py-2 text-sm font-medium text-accent-mint disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Start My Day'}
        </button>
      </div>
    </div>
  )
}
