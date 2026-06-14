import type { AppSettings } from '@shared/types/settings'
import type { TestAiProvidersResponse } from '@shared/types/insights'
import { FormField } from '@renderer/components/ui/FormField'
import { NumberInput } from '@renderer/components/ui/NumberInput'
import { SettingsSectionCard } from '@renderer/components/ui/SettingsSectionCard'
import { TextInput } from '@renderer/components/ui/TextInput'
import { Toggle } from '@renderer/components/ui/Toggle'
import { OpenRouterKeyField } from './OpenRouterKeyField'
import { useState } from 'react'

const OPENROUTER_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
  { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
]

interface AppSettingsSectionProps {
  settings: AppSettings
  openrouterKeyConfigured: boolean
  onSettingsChange: (settings: AppSettings) => void
  onUpdate: (partial: Partial<AppSettings>) => Promise<void>
  onOpenrouterKeyConfiguredChange: (configured: boolean) => void
}

export function AppSettingsSection({
  settings,
  openrouterKeyConfigured,
  onSettingsChange,
  onUpdate,
  onOpenrouterKeyConfiguredChange,
}: AppSettingsSectionProps): React.JSX.Element {
  const [testingAi, setTestingAi] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<TestAiProvidersResponse | null>(null)

  const patch = async (partial: Partial<AppSettings>): Promise<void> => {
    const next = { ...settings, ...partial }
    onSettingsChange(next)
    await onUpdate(partial)
  }

  return (
    <>
      <SettingsSectionCard
        title="How Your Day Is Built"
        description="Defaults Focus OS uses when it plans your schedule each morning."
      >
        <FormField
          label="Extra Breathing Room (%)"
          hint="Leave some open time in your day for surprises and overruns"
        >
          <NumberInput
            value={settings.defaultBufferPercent}
            min={0}
            max={50}
            onChange={(defaultBufferPercent) => void patch({ defaultBufferPercent })}
          />
        </FormField>
        <FormField
          label="Smallest Focus Block (Minutes)"
          hint="After a long break, very short blocks get moved to tomorrow instead"
        >
          <NumberInput
            value={settings.minViableBlockMinutes}
            min={5}
            max={60}
            onChange={(minViableBlockMinutes) => void patch({ minViableBlockMinutes })}
          />
        </FormField>
        <FormField
          label="Remind Me If I Have Not Touched A Client In (Hours)"
          hint="Helps you notice clients that have gone quiet"
        >
          <NumberInput
            value={settings.defaultStalenessHours}
            min={1}
            max={168}
            onChange={(defaultStalenessHours) => void patch({ defaultStalenessHours })}
          />
        </FormField>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Daily Insight (Optional)"
        description="AI can write a short daily briefing. Use cloud AI with an API key, or run a local model with Ollama."
      >
        <OpenRouterKeyField
          configured={openrouterKeyConfigured}
          onConfiguredChange={onOpenrouterKeyConfiguredChange}
        />
        <FormField label="Cloud AI Model" hint="Used when an API key is saved">
          <select
            value={settings.openrouterModel}
            onChange={(event) => void patch({ openrouterModel: event.target.value })}
            className="w-full rounded-button border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
          >
            <option value="">Choose a model</option>
            {OPENROUTER_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Or Type A Model Name" hint="For advanced users with a specific model ID">
          <TextInput
            value={settings.openrouterModel}
            onChange={(openrouterModel) => onSettingsChange({ ...settings, openrouterModel })}
            onBlur={() => void patch({ openrouterModel: settings.openrouterModel })}
            placeholder="e.g. anthropic/claude-3.5-sonnet"
          />
        </FormField>
        <FormField
          label="Local AI Address (Ollama)"
          hint="Usually http://localhost:11434 if Ollama runs on this computer"
        >
          <TextInput
            value={settings.ollamaEndpoint}
            onChange={(ollamaEndpoint) => onSettingsChange({ ...settings, ollamaEndpoint })}
            onBlur={() => void patch({ ollamaEndpoint: settings.ollamaEndpoint })}
          />
        </FormField>
        <FormField label="Local AI Model Name">
          <TextInput
            value={settings.ollamaModel}
            onChange={(ollamaModel) => onSettingsChange({ ...settings, ollamaModel })}
            onBlur={() => void patch({ ollamaModel: settings.ollamaModel })}
            placeholder="e.g. llama3"
          />
        </FormField>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={testingAi}
            onClick={() => {
              void (async () => {
                setTestingAi(true)
                try {
                  const result = await window.focusOS.settings.testAiProviders()
                  setAiTestResult(result)
                } finally {
                  setTestingAi(false)
                }
              })()
            }}
            className="rounded-button border border-surface-border px-3 py-2 text-sm text-text-secondary"
          >
            {testingAi ? 'Testing...' : 'Test Connection'}
          </button>
          {aiTestResult && (
            <div className="text-xs text-text-muted">
              <p>OpenRouter: {aiTestResult.openrouter}</p>
              <p>Ollama: {aiTestResult.ollama}</p>
            </div>
          )}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Reminders"
        description="Control break prompts and other nudges during your day."
      >
        <FormField
          label="Ask Me To Take A Break Every (Minutes)"
          hint="Micro-break popups while you are working"
        >
          <NumberInput
            value={settings.microBreakIntervalMinutes}
            min={30}
            max={180}
            onChange={(microBreakIntervalMinutes) => void patch({ microBreakIntervalMinutes })}
          />
        </FormField>
        <FormField
          label="Allowed Phone Scroll Time (Minutes)"
          hint="How long you can pick if you choose a short scroll during a break"
        >
          <NumberInput
            value={settings.doomscrollAllowanceMinutes}
            min={1}
            max={30}
            onChange={(doomscrollAllowanceMinutes) => void patch({ doomscrollAllowanceMinutes })}
          />
        </FormField>
        <Toggle
          label="Remind Me To Take Micro-Breaks"
          checked={settings.notifications.microBreak}
          onChange={(microBreak) =>
            void patch({ notifications: { ...settings.notifications, microBreak } })
          }
          showState
        />
        <Toggle
          label="Alert Me When A Client Has Gone Quiet"
          checked={settings.notifications.staleness}
          onChange={(staleness) =>
            void patch({ notifications: { ...settings.notifications, staleness } })
          }
          showState
        />
        <Toggle
          label="Tell Me When Daily Insight Is Ready"
          checked={settings.notifications.insightReady}
          onChange={(insightReady) =>
            void patch({ notifications: { ...settings.notifications, insightReady } })
          }
          showState
        />
      </SettingsSectionCard>
    </>
  )
}
