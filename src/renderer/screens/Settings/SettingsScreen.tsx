import { useEffect, useState } from 'react'
import { ScreenCard } from '@renderer/components/layout/ScreenCard'
import { getScreenDefinition } from '../screenMeta'
import { AppSettingsSection } from './AppSettingsSection'
import { ClientsProjectsSection } from './ClientsProjectsSection'
import { DisplayPreferencesSection } from './DisplayPreferencesSection'
import { ProtectedBlocksSection } from './ProtectedBlocksSection'
import { StartupBackgroundSection } from './StartupBackgroundSection'
import { GoogleConnectSection } from './GoogleConnectSection'
import { useSettingsScreen } from './hooks/useSettingsScreen'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'

const screen = getScreenDefinition('/settings')

type SettingsTab = 'essentials' | 'advanced'

export function SettingsScreen(): React.JSX.Element {
  const [tab, setTab] = useState<SettingsTab>('essentials')
  const { refreshPreferences, applyPreferences } = useDisplayPreferences()
  const {
    clients,
    protectedBlocks,
    settings,
    openrouterKeyConfigured,
    loading,
    error,
    updateSettings,
    setClients,
    setProtectedBlocks,
    setOpenrouterKeyConfigured,
    setSettings,
  } = useSettingsScreen()

  useEffect(() => {
    if (!settings) {
      return
    }
    applyPreferences({
      timeFormat: settings.timeFormat ?? '12h',
      weekStartsOn: settings.weekStartsOn ?? 'sunday',
      dateFormat: settings.dateFormat ?? 'mdy',
      defaultSleepTime: settings.defaultSleepTime ?? '23:00',
      timezone: settings.timezone ?? 'UTC',
    })
  }, [applyPreferences, settings])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ScreenCard title={screen.title} description={screen.description}>
        {loading && <p className="mt-4 text-sm text-text-muted">Loading your settings...</p>}
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {!loading && !error ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className={tab === 'essentials' ? 'focus-btn-primary' : 'focus-btn-ghost'}
              onClick={() => setTab('essentials')}
            >
              Essentials
            </button>
            <button
              type="button"
              className={tab === 'advanced' ? 'focus-btn-primary' : 'focus-btn-ghost'}
              onClick={() => setTab('advanced')}
            >
              Advanced
            </button>
          </div>
        ) : null}
      </ScreenCard>

      {!loading && !error && settings && tab === 'essentials' && (
        <>
          <DisplayPreferencesSection
            settings={settings}
            onSettingsChange={setSettings}
            onUpdate={async (partial) => {
              await updateSettings(partial)
              await refreshPreferences()
            }}
          />
          <ClientsProjectsSection clients={clients} onClientsChange={setClients} />
          <GoogleConnectSection
            settings={settings}
            onSettingsChange={setSettings}
            onUpdate={updateSettings}
          />
          <AppSettingsSection
            tier="essentials"
            settings={settings}
            openrouterKeyConfigured={openrouterKeyConfigured}
            onSettingsChange={setSettings}
            onUpdate={updateSettings}
            onOpenrouterKeyConfiguredChange={setOpenrouterKeyConfigured}
          />
        </>
      )}

      {!loading && !error && settings && tab === 'advanced' && (
        <>
          <ProtectedBlocksSection
            protectedBlocks={protectedBlocks}
            onProtectedBlocksChange={setProtectedBlocks}
          />
          <StartupBackgroundSection
            settings={settings}
            onSettingsChange={setSettings}
            onUpdate={updateSettings}
          />
          <AppSettingsSection
            tier="advanced"
            settings={settings}
            openrouterKeyConfigured={openrouterKeyConfigured}
            onSettingsChange={setSettings}
            onUpdate={updateSettings}
            onOpenrouterKeyConfiguredChange={setOpenrouterKeyConfigured}
          />
        </>
      )}
    </div>
  )
}
