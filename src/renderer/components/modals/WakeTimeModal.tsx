import { useEffect, useState } from 'react'
import { FormField } from '@renderer/components/ui/FormField'
import { NumberInput } from '@renderer/components/ui/NumberInput'
import { TimeInput } from '@renderer/components/ui/TimeInput'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
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
  const { timezone } = useDisplayPreferences()
  const [wakeTime, setWakeTime] = useState(() => getCurrentTimeHHMM(timezone))
  const [sleepTargetTime, setSleepTargetTime] = useState(defaultSleepTime)
  const [capacityHours, setCapacityHours] = useState(defaultCapacityHours)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setWakeTime(getCurrentTimeHHMM(timezone))
      setSleepTargetTime(defaultSleepTime)
      setCapacityHours(defaultCapacityHours)
    }
  }, [open, defaultSleepTime, defaultCapacityHours, timezone])

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
    <div className="focus-modal-backdrop">
      <div className="focus-modal">
        <h3 className="font-display text-lg font-semibold text-text-primary">Good Morning</h3>
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
          className="focus-btn-primary mt-5 w-full disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Start My Day'}
        </button>
      </div>
    </div>
  )
}
