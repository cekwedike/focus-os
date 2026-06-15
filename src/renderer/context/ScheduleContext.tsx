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
import type { DailyScheduleRow, ProtectedBlockRow } from '@shared/types/db'
import { isBlockSkippable } from '@shared/schedule/blockSkippable'
import { getTodayDateString } from '@renderer/utils/date'

interface ScheduleContextValue {
  date: string
  dayBundle: DayBundle | null
  loading: boolean
  error: string | null
  activeBlock: DailyScheduleRow | null
  nextBlock: DailyScheduleRow | null
  protectedBlocks: ProtectedBlockRow[]
  isBlockSkippable: (block: DailyScheduleRow) => boolean
  refresh: () => Promise<void>
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null)

export function ScheduleProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [date] = useState(getTodayDateString)
  const [dayBundle, setDayBundle] = useState<DayBundle | null>(null)
  const [protectedBlocks, setProtectedBlocks] = useState<ProtectedBlockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [bundle, templates] = await Promise.all([
        window.focusOS.schedule.getDay({ date }),
        window.focusOS.protectedBlocks.list(),
      ])
      setDayBundle(bundle)
      setProtectedBlocks(templates)
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

  const checkBlockSkippable = useCallback(
    (block: DailyScheduleRow) => isBlockSkippable(block, protectedBlocks),
    [protectedBlocks]
  )

  const value = useMemo(
    () => ({
      date,
      dayBundle,
      loading,
      error,
      activeBlock,
      nextBlock,
      protectedBlocks,
      isBlockSkippable: checkBlockSkippable,
      refresh,
    }),
    [
      date,
      dayBundle,
      loading,
      error,
      activeBlock,
      nextBlock,
      protectedBlocks,
      checkBlockSkippable,
      refresh,
    ]
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
