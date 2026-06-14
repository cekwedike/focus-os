import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { AppSettings, DisplayPreferences } from '@shared/types/settings'
import { resolveDefaultTimezone } from '@shared/constants/timezones'
import {
  formatClockTime,
  formatDateLabel,
  formatHHMM,
  isValidHHMM,
} from '@shared/utils/displayTime'

interface DisplayPreferencesContextValue {
  timeFormat: DisplayPreferences['timeFormat']
  weekStartsOn: DisplayPreferences['weekStartsOn']
  dateFormat: DisplayPreferences['dateFormat']
  defaultSleepTime: DisplayPreferences['defaultSleepTime']
  timezone: DisplayPreferences['timezone']
  formatHHMM: (hhmm: string) => string
  formatClock: (date: Date, showSeconds?: boolean) => string
  formatDate: (date: Date) => string
  applyPreferences: (preferences: Partial<DisplayPreferences>) => void
  refreshPreferences: () => Promise<void>
}

const defaultPreferences: DisplayPreferences = {
  timeFormat: '12h',
  weekStartsOn: 'sunday',
  dateFormat: 'mdy',
  defaultSleepTime: '23:00',
  timezone: resolveDefaultTimezone(),
}

const DisplayPreferencesContext = createContext<DisplayPreferencesContextValue | null>(null)

function pickDisplayPreferences(settings: AppSettings): DisplayPreferences {
  return {
    timeFormat: settings.timeFormat ?? '12h',
    weekStartsOn: settings.weekStartsOn ?? 'sunday',
    dateFormat: settings.dateFormat ?? 'mdy',
    defaultSleepTime: isValidHHMM(settings.defaultSleepTime)
      ? settings.defaultSleepTime
      : '23:00',
    timezone: settings.timezone ?? resolveDefaultTimezone(),
  }
}

export function DisplayPreferencesProvider({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const [preferences, setPreferences] = useState<DisplayPreferences>(defaultPreferences)

  const refreshPreferences = useCallback(async () => {
    const response = await window.focusOS.settings.get()
    setPreferences(pickDisplayPreferences(response.settings))
  }, [])

  useEffect(() => {
    void refreshPreferences()
  }, [refreshPreferences])

  const applyPreferences = useCallback((partial: Partial<DisplayPreferences>) => {
    setPreferences((current) => ({ ...current, ...partial }))
  }, [])

  const value = useMemo<DisplayPreferencesContextValue>(
    () => ({
      ...preferences,
      formatHHMM: (hhmm: string) => formatHHMM(hhmm, preferences.timeFormat),
      formatClock: (date: Date, showSeconds = true) =>
        formatClockTime(date, preferences.timeFormat, showSeconds, preferences.timezone),
      formatDate: (date: Date) =>
        formatDateLabel(date, preferences.dateFormat, preferences.timezone),
      applyPreferences,
      refreshPreferences,
    }),
    [applyPreferences, preferences, refreshPreferences]
  )

  return (
    <DisplayPreferencesContext.Provider value={value}>
      {children}
    </DisplayPreferencesContext.Provider>
  )
}

export function useDisplayPreferences(): DisplayPreferencesContextValue {
  const context = useContext(DisplayPreferencesContext)
  if (!context) {
    throw new Error('useDisplayPreferences must be used within DisplayPreferencesProvider')
  }
  return context
}
