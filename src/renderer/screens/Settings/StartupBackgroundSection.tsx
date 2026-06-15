import type { AppSettings } from '@shared/types/settings'
import { SettingsSectionCard } from '@renderer/components/ui/SettingsSectionCard'
import { Toggle } from '@renderer/components/ui/Toggle'

interface StartupBackgroundSectionProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
  onUpdate: (partial: Partial<AppSettings>) => Promise<void>
}

export function StartupBackgroundSection({
  settings,
  onSettingsChange,
  onUpdate,
}: StartupBackgroundSectionProps): React.JSX.Element {
  const patch = async (partial: Partial<AppSettings>): Promise<void> => {
    const next = { ...settings, ...partial }
    onSettingsChange(next)
    await onUpdate(partial)
  }

  return (
    <SettingsSectionCard
      title="Startup And Background"
      description="Control how Focus OS launches and keeps running while you work."
    >
      <Toggle
        label="Launch Focus OS When Windows Starts"
        checked={settings.launchAtLogin}
        onChange={(launchAtLogin) => void patch({ launchAtLogin })}
        showState
      />
      <p className="text-xs text-text-muted">
        Closing the window hides Focus OS to the system tray so timers and reminders keep running.
        Use Quit from the tray menu to fully exit.
      </p>
    </SettingsSectionCard>
  )
}
