import type { AppSettings } from '@shared/types/settings'
import { TIMEZONE_OPTIONS, getTimezoneLabel } from '@shared/constants/timezones'
import { FormField } from '@renderer/components/ui/FormField'
import { SegmentedControl } from '@renderer/components/ui/SegmentedControl'
import { SettingsSectionCard } from '@renderer/components/ui/SettingsSectionCard'
import { TimeInput } from '@renderer/components/ui/TimeInput'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { formatClockTime, formatDateLabel, formatHHMM, isValidHHMM } from '@shared/utils/displayTime'

interface DisplayPreferencesSectionProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
  onUpdate: (partial: Partial<AppSettings>) => Promise<void>
}

function normalizeDisplaySettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    timeFormat: settings.timeFormat ?? '12h',
    weekStartsOn: settings.weekStartsOn ?? 'sunday',
    dateFormat: settings.dateFormat ?? 'mdy',
    defaultSleepTime: isValidHHMM(settings.defaultSleepTime)
      ? settings.defaultSleepTime
      : '23:00',
    timezone: settings.timezone ?? 'UTC',
  }
}

export function DisplayPreferencesSection({
  settings,
  onSettingsChange,
  onUpdate,
}: DisplayPreferencesSectionProps): React.JSX.Element {
  const { applyPreferences } = useDisplayPreferences()
  const display = normalizeDisplaySettings(settings)
  const previewDate = new Date()

  const patch = async (partial: Partial<AppSettings>): Promise<void> => {
    const next = normalizeDisplaySettings({ ...settings, ...partial })
    onSettingsChange(next)
    applyPreferences({
      timeFormat: next.timeFormat,
      weekStartsOn: next.weekStartsOn,
      dateFormat: next.dateFormat,
      defaultSleepTime: next.defaultSleepTime,
      timezone: next.timezone,
    })
    await onUpdate(partial)
  }

  return (
    <SettingsSectionCard
      title="Time And Calendar"
      description="Choose how clocks, dates, time zones, and your day boundaries look across Focus OS."
    >
      <FormField
        label="Clock Format"
        hint="Affects the top bar clock and times shown on client cards"
      >
        <SegmentedControl
          ariaLabel="Clock Format"
          value={display.timeFormat}
          options={[
            { value: '12h', label: '12-Hour' },
            { value: '24h', label: '24-Hour' },
          ]}
          onChange={(timeFormat) => void patch({ timeFormat })}
        />
      </FormField>

      <div className="rounded-button border border-accent-mint/20 bg-accent-mint/5 px-3 py-2 text-sm text-text-primary">
        <span className="font-medium text-accent-mint">Selected: </span>
        {display.timeFormat === '12h' ? '12-Hour' : '24-Hour'} · Preview{' '}
        {formatHHMM('14:30', display.timeFormat)} · Live{' '}
        {formatClockTime(previewDate, display.timeFormat, true, display.timezone)}
      </div>

      <FormField label="Time Zone" hint="Used for the live clock and calendar dates">
        <select
          value={display.timezone}
          onChange={(event) => void patch({ timezone: event.target.value })}
          className="w-full rounded-button border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-mint/60"
        >
          {!TIMEZONE_OPTIONS.some((option) => option.value === display.timezone) && (
            <option value={display.timezone}>{getTimezoneLabel(display.timezone)}</option>
          )}
          {TIMEZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Date Format" hint="Used on screens that show calendar dates">
        <SegmentedControl
          ariaLabel="Date Format"
          value={display.dateFormat}
          options={[
            { value: 'mdy', label: 'MM/DD/YYYY' },
            { value: 'dmy', label: 'DD/MM/YYYY' },
            { value: 'ymd', label: 'YYYY-MM-DD' },
          ]}
          onChange={(dateFormat) => void patch({ dateFormat })}
        />
      </FormField>

      <div className="rounded-button border border-surface-border bg-surface-card/40 px-3 py-2 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">Today: </span>
        {formatDateLabel(previewDate, display.dateFormat, display.timezone)}
      </div>

      <FormField label="Week Starts On" hint="For weekly views and reviews">
        <SegmentedControl
          ariaLabel="Week Starts On"
          value={display.weekStartsOn}
          options={[
            { value: 'sunday', label: 'Sunday' },
            { value: 'monday', label: 'Monday' },
          ]}
          onChange={(weekStartsOn) => void patch({ weekStartsOn })}
        />
      </FormField>

      <FormField
        label="When Does Your Day Usually End?"
        hint="Default bedtime used when planning your schedule"
      >
        <TimeInput
          value={display.defaultSleepTime}
          onChange={(defaultSleepTime) => void patch({ defaultSleepTime })}
        />
      </FormField>
    </SettingsSectionCard>
  )
}
