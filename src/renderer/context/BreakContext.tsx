import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ReplanSummary } from '@shared/allocation/types'
import { useNotifications } from '@renderer/context/NotificationContext'
import { useTodayDateString } from '@renderer/hooks/useTodayDateString'

interface BreakContextValue {
  longBreakActive: boolean
  longBreakStartedAt: string | null
  longBreakPlannedMinutes: number | null
  longBreakReason: string
  replanSummary: ReplanSummary | null
  openLongBreakModal: () => void
  closeLongBreakModal: () => void
  startLongBreak: (reason: string, plannedMinutes?: number) => Promise<void>
  endLongBreak: () => Promise<void>
  clearReplanSummary: () => void
  showLongBreakModal: boolean
}

const BreakContext = createContext<BreakContextValue | null>(null)

const MICRO_ACTIVITY_MINUTES: Record<string, number> = {
  read: 10,
  walk: 15,
  call: 10,
  messages: 10,
  doomscroll: 5,
  skip: 0,
}

export function BreakProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { onMicroBreakDispatched } = useNotifications()
  const today = useTodayDateString()
  const [showLongBreakModal, setShowLongBreakModal] = useState(false)
  const [longBreakActive, setLongBreakActive] = useState(false)
  const [longBreakStartedAt, setLongBreakStartedAt] = useState<string | null>(null)
  const [longBreakPlannedMinutes, setLongBreakPlannedMinutes] = useState<number | null>(null)
  const [longBreakReason, setLongBreakReason] = useState('')
  const [longBreakBreakId, setLongBreakBreakId] = useState<number | null>(null)
  const [replanSummary, setReplanSummary] = useState<ReplanSummary | null>(null)
  const [showMicroBreakModal, setShowMicroBreakModal] = useState(false)

  const openLongBreakModal = useCallback(() => setShowLongBreakModal(true), [])
  const closeLongBreakModal = useCallback(() => setShowLongBreakModal(false), [])
  const clearReplanSummary = useCallback(() => setReplanSummary(null), [])

  const startLongBreak = useCallback(async (reason: string, plannedMinutes?: number) => {
    const startedAt = new Date().toISOString()
    const created = await window.focusOS.breaks.create({
      break_date: today,
      break_type: 'long',
      started_at: startedAt,
      reason,
      duration_minutes: plannedMinutes ?? null,
    })
    setLongBreakActive(true)
    setLongBreakStartedAt(startedAt)
    setLongBreakPlannedMinutes(plannedMinutes ?? null)
    setLongBreakReason(reason)
    setLongBreakBreakId(created.id)
    setShowLongBreakModal(false)
  }, [today])

  const endLongBreak = useCallback(async () => {
    if (!longBreakStartedAt) {
      return
    }
    const endedAt = new Date().toISOString()
    const durationMinutes = Math.max(
      1,
      Math.round((new Date(endedAt).getTime() - new Date(longBreakStartedAt).getTime()) / 60_000)
    )

    if (longBreakBreakId) {
      await window.focusOS.breaks.update({
        id: longBreakBreakId,
        ended_at: endedAt,
        duration_minutes: durationMinutes,
      })
    }

    const result = await window.focusOS.schedule.reallocate({
      scheduleDate: today,
      returnTime: endedAt,
      longBreakDurationMinutes: durationMinutes,
    })

    setReplanSummary(result.replanSummary)
    setLongBreakActive(false)
    setLongBreakStartedAt(null)
    setLongBreakPlannedMinutes(null)
    setLongBreakReason('')
    setLongBreakBreakId(null)
  }, [longBreakBreakId, longBreakStartedAt, today])

  useEffect(() => {
    return onMicroBreakDispatched(() => {
      if (!longBreakActive) {
        setShowMicroBreakModal(true)
      }
    })
  }, [longBreakActive, onMicroBreakDispatched])

  const logMicroBreak = useCallback(async (activity: string) => {
    const planned = MICRO_ACTIVITY_MINUTES[activity] ?? 10
    await window.focusOS.breaks.create({
      break_date: today,
      break_type: 'micro',
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      duration_minutes: planned,
      activity,
      reason: activity === 'skip' ? 'Skipped micro-break' : null,
    })
    setShowMicroBreakModal(false)
  }, [today])

  const value = useMemo(
    () => ({
      longBreakActive,
      longBreakStartedAt,
      longBreakPlannedMinutes,
      longBreakReason,
      replanSummary,
      openLongBreakModal,
      closeLongBreakModal,
      startLongBreak,
      endLongBreak,
      clearReplanSummary,
      showLongBreakModal,
    }),
    [
      longBreakActive,
      longBreakStartedAt,
      longBreakPlannedMinutes,
      longBreakReason,
      replanSummary,
      openLongBreakModal,
      closeLongBreakModal,
      startLongBreak,
      endLongBreak,
      clearReplanSummary,
      showLongBreakModal,
    ]
  )

  return (
    <BreakContext.Provider value={value}>
      {children}
      {showMicroBreakModal && (
        <MicroBreakOverlay onChoose={(activity) => void logMicroBreak(activity)} onDismiss={() => setShowMicroBreakModal(false)} />
      )}
    </BreakContext.Provider>
  )
}

function MicroBreakOverlay({
  onChoose,
  onDismiss,
}: {
  onChoose: (activity: string) => void
  onDismiss: () => void
}): React.JSX.Element {
  const activities = [
    { id: 'read', label: 'Read' },
    { id: 'walk', label: 'Walk' },
    { id: 'call', label: 'Call/Text Someone' },
    { id: 'messages', label: 'Check Messages' },
    { id: 'doomscroll', label: 'Short Doomscroll' },
    { id: 'skip', label: 'Skip' },
  ]

  return (
    <div className="focus-modal-backdrop">
      <div className="focus-modal">
        <h3 className="font-display text-lg font-semibold text-text-primary">Micro-Break Time</h3>
        <p className="mt-2 text-sm text-text-muted">Pick a short activity for your break.</p>
        <div className="mt-4 grid gap-2">
          {activities.map((activity) => (
            <button
              key={activity.id}
              type="button"
              onClick={() => onChoose(activity.id)}
              className="focus-subpanel w-full px-3 py-2.5 text-left text-sm text-text-primary hover:border-accent-mint/40"
            >
              {activity.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 text-sm text-text-muted hover:text-text-secondary"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

export function useBreakContext(): BreakContextValue {
  const context = useContext(BreakContext)
  if (!context) {
    throw new Error('useBreakContext must be used within BreakProvider')
  }
  return context
}
