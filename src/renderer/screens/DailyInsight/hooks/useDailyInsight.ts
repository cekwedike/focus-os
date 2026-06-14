import { useCallback, useEffect, useState } from 'react'
import type { InsightLogRow } from '@shared/types/insights'
import { getTodayDateString } from '@renderer/utils/date'

export function useDailyInsight() {
  const today = getTodayDateString()
  const [todayInsight, setTodayInsight] = useState<InsightLogRow | null>(null)
  const [history, setHistory] = useState<InsightLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    const entries = await window.focusOS.insights.list({ limit: 30 })
    setHistory(entries)
  }, [])

  const refreshToday = useCallback(async () => {
    setGenerating(true)
    setError(null)
    try {
      const generated = await window.focusOS.insights.generate({ date: today })
      setTodayInsight(generated)
      await loadHistory()
    } catch (refreshError) {
      setError(String(refreshError))
    } finally {
      setGenerating(false)
    }
  }, [loadHistory, today])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const existing = await window.focusOS.insights.getToday({ date: today })
        if (cancelled) {
          return
        }

        if (existing) {
          setTodayInsight(existing)
          await loadHistory()
        } else {
          const generated = await window.focusOS.insights.generate({ date: today })
          if (!cancelled) {
            setTodayInsight(generated)
            await loadHistory()
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(String(loadError))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loadHistory, today])

  return {
    today,
    todayInsight,
    history,
    loading,
    generating,
    error,
    refreshToday,
  }
}
