import { useState } from 'react'
import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { FormField } from '@renderer/components/ui/FormField'
import { NumberInput } from '@renderer/components/ui/NumberInput'
import { TimeInput } from '@renderer/components/ui/TimeInput'
import { ConfirmDialog } from '@renderer/components/ui/ConfirmDialog'
import { getScreenDefinition } from '../screenMeta'
import { AllocationPreviewList } from './components/AllocationPreviewList'
import { useDailyWorkspace } from './hooks/useDailyWorkspace'

const screen = getScreenDefinition('/daily-workspace')

export function DailyWorkspaceScreen(): React.JSX.Element {
  const {
    wakeTime,
    setWakeTime,
    sleepTargetTime,
    setSleepTargetTime,
    capacityHours,
    setCapacityHours,
    bufferPercent,
    setBufferPercent,
    fixedClients,
    fixedOverrides,
    updateFixedOverride,
    preview,
    loading,
    generating,
    error,
    hasExistingSchedule,
    autoAssign,
    confirmSchedule,
  } = useDailyWorkspace()

  const [showOverwrite, setShowOverwrite] = useState(false)

  const handleConfirm = async (): Promise<void> => {
    if (hasExistingSchedule) {
      setShowOverwrite(true)
      return
    }
    await confirmSchedule(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ScreenCard title={screen.title} description={screen.description} />
      {loading && <p className="text-sm text-text-muted">Loading day settings...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="focus-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Day Parameters</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Wake Time">
            <TimeInput value={wakeTime} onChange={setWakeTime} />
          </FormField>
          <FormField label="End Of Day Time">
            <TimeInput value={sleepTargetTime} onChange={setSleepTargetTime} />
          </FormField>
          <FormField label="Total Capacity (Hours)">
            <NumberInput value={capacityHours} min={1} max={16} onChange={setCapacityHours} />
          </FormField>
          <FormField label="Buffer (%)">
            <NumberInput value={bufferPercent} min={0} max={50} onChange={setBufferPercent} />
          </FormField>
        </div>
      </section>

      {fixedClients.length > 0 && (
        <section className="focus-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Today&apos;s Fixed Blocks</h3>
          {fixedClients.map((client) => {
            const override = fixedOverrides.find((entry) => entry.clientId === client.id)
            const start = override?.start ?? client.fixed_block_start ?? '09:00'
            const duration =
              override?.durationMinutes ?? client.fixed_block_duration_minutes ?? 60
            return (
              <div key={client.id} className="grid gap-2 sm:grid-cols-3 items-end">
                <p className="text-sm text-text-primary">{client.name}</p>
                <FormField label="Starts At">
                  <TimeInput
                    value={start}
                    onChange={(value) => updateFixedOverride(client.id, value, duration)}
                  />
                </FormField>
                <FormField label="Duration (Minutes)">
                  <NumberInput
                    value={duration}
                    min={15}
                    onChange={(value) => updateFixedOverride(client.id, start, value)}
                  />
                </FormField>
              </div>
            )
          })}
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={generating}
          onClick={() => void autoAssign()}
          className="focus-btn-primary disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Auto-Assign'}
        </button>
        {preview && (
          <button
            type="button"
            disabled={generating}
            onClick={() => void handleConfirm()}
            className="rounded-button border border-accent-mint/40 px-4 py-2 text-sm font-medium text-accent-mint disabled:opacity-50"
          >
            Confirm Schedule
          </button>
        )}
      </div>

      {preview && <AllocationPreviewList preview={preview} />}

      <ConfirmDialog
        open={showOverwrite}
        title="Overwrite Today&apos;s Schedule?"
        message="You already have a schedule for today. Confirming will replace non-completed blocks with the new preview."
        confirmLabel="Overwrite Schedule"
        onConfirm={() => {
          setShowOverwrite(false)
          void confirmSchedule(true)
        }}
        onCancel={() => setShowOverwrite(false)}
      />
    </div>
  )
}
