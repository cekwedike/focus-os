import { useMemo, useState } from 'react'
import type { ClientProjectRow } from '@shared/types/db'
import type { AppSettings } from '@shared/types/settings'
import { FormField } from '@renderer/components/ui/FormField'
import { TextInput } from '@renderer/components/ui/TextInput'
import { NumberInput } from '@renderer/components/ui/NumberInput'
import { DurationInput } from '@renderer/components/ui/DurationInput'

interface WizardClientDraft {
  name: string
  weightPercent: number
  fixedBlockEnabled: boolean
  fixedBlockStart: string
  fixedBlockDurationMinutes: number
  reminderIntervalMinutes: number
}

interface FreelancerOnboardingWizardProps {
  open: boolean
  settings: AppSettings
  clients: ClientProjectRow[]
  onClientsChange: (clients: ClientProjectRow[]) => void
  onUpdateSettings: (partial: Partial<AppSettings>) => Promise<void>
  onComplete: () => Promise<void>
}

const DEFAULT_CLIENT: WizardClientDraft = {
  name: '',
  weightPercent: 25,
  fixedBlockEnabled: false,
  fixedBlockStart: '12:00',
  fixedBlockDurationMinutes: 240,
  reminderIntervalMinutes: 0,
}

export function FreelancerOnboardingWizard({
  open,
  settings,
  clients,
  onClientsChange,
  onUpdateSettings,
  onComplete,
}: FreelancerOnboardingWizardProps): React.JSX.Element | null {
  const [step, setStep] = useState(0)
  const [drafts, setDrafts] = useState<WizardClientDraft[]>([
    { ...DEFAULT_CLIENT, name: 'Client 1' },
    { ...DEFAULT_CLIENT, name: 'Client 2' },
  ])
  const [workHours, setWorkHours] = useState(8)
  const [saving, setSaving] = useState(false)

  const activeClients = useMemo(
    () => clients.filter((client) => client.is_active === 1),
    [clients]
  )

  if (!open) {
    return null
  }

  const updateDraft = (index: number, patch: Partial<WizardClientDraft>): void => {
    setDrafts((current) =>
      current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft))
    )
  }

  const addClient = (): void => {
    setDrafts((current) => [
      ...current,
      { ...DEFAULT_CLIENT, name: `Client ${current.length + 1}` },
    ])
  }

  const finish = async (): Promise<void> => {
    setSaving(true)
    try {
      for (const draft of drafts.filter((item) => item.name.trim())) {
        await window.focusOS.clients.create({
          name: draft.name.trim(),
          color: '#22d3ee',
          weight_percent: draft.weightPercent,
          is_active: true,
          fixed_block_enabled: draft.fixedBlockEnabled,
          fixed_block_start: draft.fixedBlockEnabled ? draft.fixedBlockStart : null,
          fixed_block_duration_minutes: draft.fixedBlockEnabled
            ? draft.fixedBlockDurationMinutes
            : null,
          reminder_enabled: draft.reminderIntervalMinutes > 0,
          reminder_interval_minutes:
            draft.reminderIntervalMinutes > 0 ? draft.reminderIntervalMinutes : null,
          reminder_label:
            draft.reminderIntervalMinutes > 0 ? `Check in on ${draft.name}` : null,
        })
      }

      await onUpdateSettings({
        freelancerWizardComplete: true,
      })
      await window.focusOS.integrations.completeOnboarding()

      const refreshed = await window.focusOS.clients.list()
      onClientsChange(refreshed)
      await onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-accent-cyan/20 bg-surface p-6 shadow-2xl">
        <p className="focus-kicker">Freelancer setup</p>
        <h2 className="font-display text-xl font-bold text-gradient-mint">
          Teach your assistant your clients
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Step {step + 1} of 3 — you can change everything later in Settings.
        </p>

        {step === 0 ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-text-secondary">
              You have {activeClients.length} active client
              {activeClients.length === 1 ? '' : 's'} already. Add the jobs you juggle daily.
            </p>
            {drafts.map((draft, index) => (
              <div key={index} className="rounded-xl border border-white/10 p-4">
                <FormField label="Client / project name">
                  <TextInput
                    value={draft.name}
                    onChange={(name) => updateDraft(index, { name })}
                  />
                </FormField>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <FormField label="Weight %">
                    <NumberInput
                      value={draft.weightPercent}
                      min={0}
                      max={100}
                      onChange={(weightPercent) => updateDraft(index, { weightPercent })}
                    />
                  </FormField>
                  <FormField label="Check-in every (minutes, 0 = off)">
                    <NumberInput
                      value={draft.reminderIntervalMinutes}
                      min={0}
                      max={180}
                      onChange={(reminderIntervalMinutes) =>
                        updateDraft(index, { reminderIntervalMinutes })
                      }
                    />
                  </FormField>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-sm text-accent-mint"
              onClick={addClient}
            >
              + Add another client
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-6 space-y-4">
            {drafts.map((draft, index) => (
              <div key={index} className="rounded-xl border border-white/10 p-4">
                <p className="text-sm font-medium text-text-primary">{draft.name || 'Client'}</p>
                <label className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                  <input
                    type="checkbox"
                    checked={draft.fixedBlockEnabled}
                    onChange={(event) =>
                      updateDraft(index, { fixedBlockEnabled: event.target.checked })
                    }
                  />
                  Fixed daily block (e.g. 12pm–midnight shift)
                </label>
                {draft.fixedBlockEnabled ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <FormField label="Block start">
                      <TextInput
                        value={draft.fixedBlockStart}
                        onChange={(fixedBlockStart) => updateDraft(index, { fixedBlockStart })}
                        placeholder="12:00"
                      />
                    </FormField>
                    <FormField label="Block duration">
                      <DurationInput
                        valueMinutes={draft.fixedBlockDurationMinutes}
                        onChange={(fixedBlockDurationMinutes) =>
                          updateDraft(index, { fixedBlockDurationMinutes })
                        }
                      />
                    </FormField>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-4">
            <FormField
              label="Intended work hours per day"
              hint="Used when you log wake time to size your day"
            >
              <NumberInput value={workHours} min={4} max={16} onChange={setWorkHours} />
            </FormField>
            <p className="text-sm text-text-muted">
              Connect Google in Settings for calendar-aware scheduling and inbox triage. Morning
              and hourly briefings are enabled by default.
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex justify-between gap-3">
          <button
            type="button"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm"
            disabled={step === 0 || saving}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            Back
          </button>
          {step < 2 ? (
            <button
              type="button"
              className="rounded-lg bg-accent-mint px-4 py-2 text-sm font-medium text-surface"
              onClick={() => setStep((current) => current + 1)}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-accent-mint px-4 py-2 text-sm font-medium text-surface disabled:opacity-50"
              onClick={() => void finish()}
            >
              {saving ? 'Saving...' : 'Finish setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
