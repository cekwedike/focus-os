import { useEffect } from 'react'
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

export function SettingsScreen(): React.JSX.Element {
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
      </ScreenCard>

      {!loading && !error && settings && (
        <>
          <ClientsProjectsSection clients={clients} onClientsChange={setClients} />
          <ProtectedBlocksSection
            protectedBlocks={protectedBlocks}
            onProtectedBlocksChange={setProtectedBlocks}
          />
          <DisplayPreferencesSection
            settings={settings}
            onSettingsChange={setSettings}
            onUpdate={async (partial) => {
              await updateSettings(partial)
              await refreshPreferences()
            }}
          />
          <StartupBackgroundSection
            settings={settings}
            onSettingsChange={setSettings}
            onUpdate={updateSettings}
          />
          <GoogleConnectSection
            settings={settings}
            onSettingsChange={setSettings}
            onUpdate={updateSettings}
          />
          <AppSettingsSection
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
