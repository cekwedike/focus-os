import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReviewSummary } from '@shared/types/review'
import { useTodayDateString } from '@renderer/hooks/useTodayDateString'
import { getTodayDateString } from '@renderer/utils/date'

export type ReviewRangePreset = 'this-week' | 'last-7' | 'last-30' | 'this-month' | 'custom'

export interface ReviewDateRange {
  startDate: string
  endDate: string
  preset: ReviewRangePreset
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function startOfWeek(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`)
  const day = date.getDay()
  const diff = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - diff)
  return date.toISOString().slice(0, 10)
}

function startOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`
}

export function buildRangeForPreset(preset: ReviewRangePreset, today = getTodayDateString()): ReviewDateRange {
  switch (preset) {
    case 'this-week':
      return { preset, startDate: startOfWeek(today), endDate: today }
    case 'last-7':
      return { preset, startDate: addDays(today, -6), endDate: today }
    case 'last-30':
      return { preset, startDate: addDays(today, -29), endDate: today }
    case 'this-month':
      return { preset, startDate: startOfMonth(today), endDate: today }
    default:
      return { preset: 'last-7', startDate: addDays(today, -6), endDate: today }
  }
}

export function useReviewSummary() {
  const today = useTodayDateString()
  const [range, setRange] = useState<ReviewDateRange>(() => buildRangeForPreset('last-7', today))
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.focusOS.review.getSummary({
        startDate: range.startDate,
        endDate: range.endDate,
      })
      setSummary(result)
    } catch (refreshError) {
      setError(String(refreshError))
    } finally {
      setLoading(false)
    }
  }, [range.endDate, range.startDate])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setPreset = useCallback((preset: ReviewRangePreset) => {
    if (preset === 'custom') {
      setRange((current) => ({ ...current, preset }))
      return
    }
    setRange(buildRangeForPreset(preset, today))
  }, [today])

  const setCustomRange = useCallback((startDate: string, endDate: string) => {
    setRange({ preset: 'custom', startDate, endDate })
  }, [])

  const rangeLabel = useMemo(
    () => `${range.startDate} to ${range.endDate}`,
    [range.endDate, range.startDate]
  )

  return {
    range,
    rangeLabel,
    summary,
    loading,
    error,
    setPreset,
    setCustomRange,
    refresh,
  }
}
