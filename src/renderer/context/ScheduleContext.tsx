import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { DayBundle } from '@shared/types/schedule'
import type { DailyScheduleRow } from '@shared/types/db'
import { getTodayDateString } from '@renderer/utils/date'

interface ScheduleContextValue {
  date: string
  dayBundle: DayBundle | null
  loading: boolean
  error: string | null
  activeBlock: DailyScheduleRow | null
  nextBlock: DailyScheduleRow | null
  refresh: () => Promise<void>
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null)

export function ScheduleProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [date] = useState(getTodayDateString)
  const [dayBundle, setDayBundle] = useState<DayBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const bundle = await window.focusOS.schedule.getDay({ date })
      setDayBundle(bundle)
    } catch (refreshError) {
      setError(String(refreshError))
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    void refresh()
    const intervalId = window.setInterval(() => {
      void refresh()
    }, 30_000)

    const unsubscribe = window.focusOS.onScheduleBlockChanged(() => {
      void refresh()
    })

    return () => {
      window.clearInterval(intervalId)
      unsubscribe()
    }
  }, [refresh])

  const activeBlock = useMemo(
    () => dayBundle?.blocks.find((block) => block.status === 'active') ?? null,
    [dayBundle]
  )

  const nextBlock = useMemo(() => {
    if (!dayBundle) {
      return null
    }
    const now = Date.now()
    return (
      dayBundle.blocks.find(
        (block) =>
          block.status === 'planned' && new Date(block.planned_start).getTime() >= now
      ) ??
      dayBundle.blocks.find((block) => block.status === 'planned') ??
      null
    )
  }, [dayBundle])

  const value = useMemo(
    () => ({
      date,
      dayBundle,
      loading,
      error,
      activeBlock,
      nextBlock,
      refresh,
    }),
    [date, dayBundle, loading, error, activeBlock, nextBlock, refresh]
  )

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}

export function useScheduleContext(): ScheduleContextValue {
  const context = useContext(ScheduleContext)
  if (!context) {
    throw new Error('useScheduleContext must be used within ScheduleProvider')
  }
  return context
}
