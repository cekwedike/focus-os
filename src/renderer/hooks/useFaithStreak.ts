import { useCallback, useEffect, useState } from 'react'
import type { JournalStatsResponse } from '@shared/types/journal'
import { getTodayDateString } from '@renderer/utils/date'

export function useFaithStreak(): {
  stats: JournalStatsResponse | null
  loading: boolean
  refresh: () => Promise<void>
} {
  const [stats, setStats] = useState<JournalStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.focusOS.journal.stats({ today: getTodayDateString() })
      setStats(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { stats, loading, refresh }
}
