import { useCallback, useEffect, useState } from 'react'
import type { GoogleConnectionStatus } from '@shared/types/integrations'
import type { AppSettings } from '@shared/types/settings'
import { SettingsSectionCard } from '@renderer/components/ui/SettingsSectionCard'
import { Toggle } from '@renderer/components/ui/Toggle'
import { FormField } from '@renderer/components/ui/FormField'
import { NumberInput } from '@renderer/components/ui/NumberInput'

interface GoogleConnectSectionProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
  onUpdate: (partial: Partial<AppSettings>) => Promise<void>
}

export function GoogleConnectSection({
  settings,
  onSettingsChange,
  onUpdate,
}: GoogleConnectSectionProps): React.JSX.Element {
  const [status, setStatus] = useState<GoogleConnectionStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refreshStatus = useCallback(async () => {
    const next = await window.focusOS.integrations.googleStatus()
    setStatus(next)
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const patch = async (partial: Partial<AppSettings>): Promise<void> => {
    const next = { ...settings, ...partial }
    onSettingsChange(next)
    await onUpdate(partial)
  }

  const connect = async (): Promise<void> => {
    setLoading(true)
    setMessage(null)
    try {
      const next = await window.focusOS.integrations.googleConnect()
      setStatus(next)
      setMessage('Google account connected.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Connect failed')
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async (): Promise<void> => {
    setLoading(true)
    setMessage(null)
    try {
      const next = await window.focusOS.integrations.googleDisconnect()
      setStatus(next)
      setMessage('Disconnected.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Disconnect failed')
    } finally {
      setLoading(false)
    }
  }

  const syncNow = async (): Promise<void> => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await window.focusOS.integrations.googleSync()
      setMessage(`Synced ${result.calendarCount} events and ${result.emailCount} emails.`)
      await refreshStatus()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsSectionCard
      title="Google Assistant Connections"
      description="Read-only Gmail and Calendar sync so your assistant sees meetings and actionable emails."
    >
      {!status?.configured ? (
        <p className="text-sm text-amber-300">
          Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file, then restart Focus OS.
        </p>
      ) : null}

      <div className="mt-3 rounded-xl border border-white/10 bg-surface/50 p-4 text-sm">
        <p className="text-text-primary">
          Status:{' '}
          <span className={status?.connected ? 'text-accent-mint' : 'text-text-muted'}>
            {status?.connected ? `Connected as ${status.accountEmail}` : 'Not connected'}
          </span>
        </p>
        {status?.lastSyncAt ? (
          <p className="mt-1 text-xs text-text-muted">Last sync: {status.lastSyncAt}</p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || !status?.configured || status.connected}
          className="rounded-lg bg-accent-mint px-4 py-2 text-sm font-medium text-surface disabled:opacity-50"
          onClick={() => void connect()}
        >
          Connect Google
        </button>
        <button
          type="button"
          disabled={loading || !status?.connected}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-text-primary disabled:opacity-50"
          onClick={() => void syncNow()}
        >
          Sync now
        </button>
        <button
          type="button"
          disabled={loading || !status?.connected}
          className="rounded-lg border border-red-400/40 px-4 py-2 text-sm text-red-300 disabled:opacity-50"
          onClick={() => void disconnect()}
        >
          Disconnect
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-text-muted">{message}</p> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <FormField label="Gmail triage" hint="Fetch inbox metadata and suggest tasks">
          <Toggle
            label="Enabled"
            checked={settings.google.gmailEnabled}
            onChange={(gmailEnabled) =>
              void patch({ google: { ...settings.google, gmailEnabled } })
            }
          />
        </FormField>
        <FormField label="Calendar blocks" hint="Treat Google events as immovable in your schedule">
          <Toggle
            label="Enabled"
            checked={settings.google.calendarEnabled}
            onChange={(calendarEnabled) =>
              void patch({ google: { ...settings.google, calendarEnabled } })
            }
          />
        </FormField>
        <FormField label="Sync interval (minutes)" hint="How often to refresh Gmail and Calendar">
          <NumberInput
            value={settings.googleSyncIntervalMinutes}
            min={5}
            max={240}
            onChange={(googleSyncIntervalMinutes) => void patch({ googleSyncIntervalMinutes })}
          />
        </FormField>
      </div>

      <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
        <p className="text-sm font-medium text-text-primary">Proactive assistant</p>
        <Toggle
          label="Morning briefing"
          checked={settings.assistant.morningEnabled}
          onChange={(morningEnabled) =>
            void patch({ assistant: { ...settings.assistant, morningEnabled } })
          }
        />
        <Toggle
          label="Hourly check-ins"
          checked={settings.assistant.hourlyEnabled}
          onChange={(hourlyEnabled) =>
            void patch({ assistant: { ...settings.assistant, hourlyEnabled } })
          }
        />
        <Toggle
          label="15-minute meeting reminders"
          checked={settings.assistant.preMeetingEnabled}
          onChange={(preMeetingEnabled) =>
            void patch({ assistant: { ...settings.assistant, preMeetingEnabled } })
          }
        />
        <FormField label="Morning briefing hour" hint="Local hour (0-23) when the morning ping may fire">
          <NumberInput
            value={settings.assistant.morningHour}
            min={0}
            max={23}
            onChange={(morningHour) =>
              void patch({ assistant: { ...settings.assistant, morningHour } })
            }
          />
        </FormField>
      </div>
    </SettingsSectionCard>
  )
}
