import { useEffect, useState } from 'react'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { getTodayDateString } from '@renderer/utils/date'

export function useTodayDateString(): string {
  const { timezone } = useDisplayPreferences()
  const [today, setToday] = useState(() => getTodayDateString(timezone))

  useEffect(() => {
    setToday(getTodayDateString(timezone))
    const intervalId = window.setInterval(() => {
      setToday((current) => {
        const next = getTodayDateString(timezone)
        return current === next ? current : next
      })
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [timezone])

  return today
}
