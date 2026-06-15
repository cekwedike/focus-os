import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DueCheckInEntry } from '@shared/types/ipc'

interface CheckInDueContextValue {
  dueEntries: DueCheckInEntry[]
  acknowledge: (clientId: number) => Promise<void>
  refresh: () => Promise<void>
}

const CheckInDueContext = createContext<CheckInDueContextValue | null>(null)

export function CheckInDueProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [dueEntries, setDueEntries] = useState<DueCheckInEntry[]>([])

  const refresh = useCallback(async (): Promise<void> => {
    const response = await window.focusOS.checkIns.getDue()
    setDueEntries(response.due)
  }, [])

  const acknowledge = useCallback(async (clientId: number): Promise<void> => {
    const response = await window.focusOS.checkIns.acknowledge({ clientId })
    setDueEntries(response.due)
  }, [])

  useEffect(() => {
    void refresh()
    const unsubscribe = window.focusOS.onCheckInStateChanged((payload) => {
      setDueEntries(payload.due)
    })
    return unsubscribe
  }, [refresh])

  const value = useMemo(
    () => ({
      dueEntries,
      acknowledge,
      refresh,
    }),
    [dueEntries, acknowledge, refresh]
  )

  return <CheckInDueContext.Provider value={value}>{children}</CheckInDueContext.Provider>
}

export function useCheckInDue(): CheckInDueContextValue {
  const context = useContext(CheckInDueContext)
  if (!context) {
    throw new Error('useCheckInDue must be used within CheckInDueProvider')
  }
  return context
}
