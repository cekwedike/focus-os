import { useEffect, useMemo, useState } from 'react'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import {
  formatMonthDayInTimezone,
  getTimezoneAbbreviation,
  getTimezoneOffsetLabel,
  getWeekdayInTimezone,
} from '@shared/utils/displayTime'

export interface LiveChronoSnapshot {
  now: Date
  time: string
  dateLabel: string
  weekday: string
  monthDay: string
  timezoneAbbr: string
  timezoneOffset: string
  isoDateTime: string
}

export function useLiveChrono(showSeconds = true): LiveChronoSnapshot {
  const { formatClock, formatDate, timezone } = useDisplayPreferences()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  return useMemo(
    () => ({
      now,
      time: formatClock(now, showSeconds),
      dateLabel: formatDate(now),
      weekday: getWeekdayInTimezone(now, timezone),
      monthDay: formatMonthDayInTimezone(now, timezone),
      timezoneAbbr: getTimezoneAbbreviation(now, timezone),
      timezoneOffset: getTimezoneOffsetLabel(now, timezone),
      isoDateTime: now.toISOString(),
    }),
    [formatClock, formatDate, now, showSeconds, timezone]
  )
}
