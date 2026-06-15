import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FaithLogRow } from '@shared/types/db'
import type { JournalStatsResponse } from '@shared/types/journal'
import { useTodayDateString } from '@renderer/hooks/useTodayDateString'

export function useJournal() {
  const today = useTodayDateString()
  const [todayEntry, setTodayEntry] = useState<FaithLogRow | null>(null)
  const [history, setHistory] = useState<FaithLogRow[]>([])
  const [stats, setStats] = useState<JournalStatsResponse | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [entry, entries, journalStats] = await Promise.all([
        window.focusOS.journal.getEntry({ date: today }),
        window.focusOS.journal.list(),
        window.focusOS.journal.stats({ today }),
      ])
      setTodayEntry(entry)
      setHistory(entries.filter((item) => item.entry_date !== today))
      setStats(journalStats)
    } catch (refreshError) {
      setError(String(refreshError))
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return history
    }
    return history.filter(
      (entry) =>
        entry.bible_reference?.toLowerCase().includes(query) ||
        entry.prayer_notes?.toLowerCase().includes(query) ||
        entry.entry_date.includes(query)
    )
  }, [history, search])

  const saveTodayEntry = useCallback(
    async (bibleReference: string, prayerNotes: string): Promise<void> => {
      await window.focusOS.journal.upsert({
        entry_date: today,
        bible_reference: bibleReference,
        prayer_notes: prayerNotes || null,
      })
      await refresh()
    },
    [refresh, today]
  )

  return {
    today,
    todayEntry,
    history: filteredHistory,
    stats,
    search,
    setSearch,
    loading,
    error,
    refresh,
    saveTodayEntry,
  }
}
