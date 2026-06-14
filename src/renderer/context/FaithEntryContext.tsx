import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { FaithEntryModal } from '@renderer/components/modals/FaithEntryModal'
import { useScheduleContext } from './ScheduleContext'

interface FaithEntryContextValue {
  isFaithBlockActive: boolean
  openFaithEntry: () => void
}

const FaithEntryContext = createContext<FaithEntryContextValue | null>(null)

export function FaithEntryProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { activeBlock, refresh } = useScheduleContext()
  const [open, setOpen] = useState(false)

  const isFaithBlockActive =
    activeBlock?.block_type === 'protected' &&
    activeBlock?.protected_subtype === 'faith' &&
    activeBlock.status === 'active'

  const openFaithEntry = useCallback(() => {
    if (isFaithBlockActive) {
      setOpen(true)
    }
  }, [isFaithBlockActive])

  const value = useMemo(
    () => ({
      isFaithBlockActive,
      openFaithEntry,
    }),
    [isFaithBlockActive, openFaithEntry]
  )

  return (
    <FaithEntryContext.Provider value={value}>
      {children}
      <FaithEntryModal
        open={open}
        blockId={activeBlock?.id}
        onClose={() => setOpen(false)}
        onComplete={async () => {
          await refresh()
        }}
      />
    </FaithEntryContext.Provider>
  )
}

export function useFaithEntry(): FaithEntryContextValue {
  const context = useContext(FaithEntryContext)
  if (!context) {
    throw new Error('useFaithEntry must be used within FaithEntryProvider')
  }
  return context
}
