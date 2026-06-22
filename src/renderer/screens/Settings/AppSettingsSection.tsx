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
  tier?: 'essentials' | 'advanced' | 'all'
  settings: AppSettings
  openrouterKeyConfigured: boolean
  onSettingsChange: (settings: AppSettings) => void
  onUpdate: (partial: Partial<AppSettings>) => Promise<void>
  onOpenrouterKeyConfiguredChange: (configured: boolean) => void
}

export function AppSettingsSection({
  tier = 'all',
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

  const showEssentials = tier === 'all' || tier === 'essentials'
  const showAdvanced = tier === 'all' || tier === 'advanced'

  return (
    <>
      {showAdvanced ? (
      <SettingsSectionCard
        title="How Your Day Is Built"
        description="Optional tuning for buffer and block sizing. Most people can leave these alone."
      >
        <FormField
          label="Extra Breathing Room (%)"
          hint="Percentage of your unscheduled flexible time reserved as buffer. 10-15% is recommended. Very high values leave little time for actual client work."
        >
          <NumberInput
            value={settings.defaultBufferPercent}
            min={0}
            max={50}
            onChange={(defaultBufferPercent) => void patch({ defaultBufferPercent })}
          />
          {settings.defaultBufferPercent > 30 ? (
            <p className="mt-2 text-xs text-amber-400/90">
              This reserves a large portion of your flexible time. Consider a lower value unless you
              have frequent unplanned work.
            </p>
          ) : null}
        </FormField>
        <FormField
          label="Maximum Buffer Block (Minutes)"
          hint="Hard ceiling on buffer block duration. If your buffer percentage would exceed this, the extra time goes to client work instead."
        >
          <NumberInput
            value={settings.maxBufferMinutes}
            min={15}
            max={180}
            onChange={(maxBufferMinutes) => void patch({ maxBufferMinutes })}
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
      ) : null}

      {showAdvanced ? (
      <SettingsSectionCard
        title="Daily Insight (Optional)"
        description="Cloud or local AI for richer chat and daily briefings. Not required for the core assistant."
      >
        <OpenRouterKeyField
          configured={openrouterKeyConfigured}
          onConfiguredChange={onOpenrouterKeyConfiguredChange}
        />
        <FormField label="Cloud AI Model" hint="Used when an API key is saved. Falls back to OPENROUTER_MODEL from .env in development.">
          <select
            value={settings.openrouterModel}
            onChange={(event) => void patch({ openrouterModel: event.target.value })}
            className="focus-input"
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
        <FormField
          label="Chat Fallback Free Models"
          hint="One model ID per line. Used when chat cannot match your message. Tried in order before Ollama."
        >
          <textarea
            value={settings.openrouterFreeModels.join('\n')}
            onChange={(event) => {
              const openrouterFreeModels = event.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
              onSettingsChange({ ...settings, openrouterFreeModels })
            }}
            onBlur={() => void patch({ openrouterFreeModels: settings.openrouterFreeModels })}
            rows={4}
            className="focus-input resize-y font-mono text-xs"
            placeholder="google/gemma-2-9b-it:free"
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
            className="focus-btn-ghost"
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
      ) : null}

      {showAdvanced ? (
      <SettingsSectionCard
        title="Voice"
        description="Optional speech input and read-aloud for assistant messages."
      >
        <Toggle
          label="Show Microphone In Chat"
          checked={settings.voiceInputEnabled}
          onChange={(voiceInputEnabled) => void patch({ voiceInputEnabled })}
          showState
        />
        <Toggle
          label="Read Assistant Messages Aloud"
          checked={settings.voiceOutputEnabled}
          onChange={(voiceOutputEnabled) => void patch({ voiceOutputEnabled })}
          showState
        />
        <p className="text-xs text-text-muted">
          Text-to-speech uses your system voices. A new assistant message cancels any speech in
          progress.
        </p>
      </SettingsSectionCard>
      ) : null}

      {showEssentials ? (
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
          label="Client Check-in Reminders"
          checked={settings.notifications.clientReminder}
          onChange={(clientReminder) =>
            void patch({ notifications: { ...settings.notifications, clientReminder } })
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
      ) : null}
    </>
  )
}
