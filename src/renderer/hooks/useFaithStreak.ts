import { useCallback, useEffect, useState } from 'react'
import type { JournalStatsResponse } from '@shared/types/journal'
import { useTodayDateString } from '@renderer/hooks/useTodayDateString'

export function useFaithStreak(): {
  stats: JournalStatsResponse | null
  loading: boolean
  refresh: () => Promise<void>
} {
  const [stats, setStats] = useState<JournalStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const today = useTodayDateString()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.focusOS.journal.stats({ today })
      setStats(result)
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { stats, loading, refresh }
}
