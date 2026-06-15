import { useEffect, useState, type ReactNode } from 'react'
import { SidebarNav } from './SidebarNav'
import { TopStatusBar } from './TopStatusBar'
import { WakeTimeModal } from '@renderer/components/modals/WakeTimeModal'
import { LongBreakModal } from '@renderer/components/modals/LongBreakModal'
import { ReplanSummaryModal } from '@renderer/components/modals/ReplanSummaryModal'
import { getTodayDateString } from '@renderer/utils/date'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const [showWakeModal, setShowWakeModal] = useState(false)
  const [defaultSleepTime, setDefaultSleepTime] = useState('22:00')
  const [defaultCapacityHours, setDefaultCapacityHours] = useState(8)

  useEffect(() => {
    void (async () => {
      const today = getTodayDateString()
      const [daily, settings] = await Promise.all([
        window.focusOS.daily.get({ date: today }),
        window.focusOS.settings.get(),
      ])

      const yesterday = daily.yesterday
      setDefaultSleepTime(
        yesterday?.sleep_target_time ?? settings.settings.defaultSleepTime ?? '22:00'
      )
      const capacityMinutes = yesterday?.remaining_minutes_at_wake ?? 480
      setDefaultCapacityHours(Math.round(capacityMinutes / 60))

      if (!daily.settings) {
        setShowWakeModal(true)
      }
    })()
  }, [])

  const handleWakeConfirm = async (values: {
    wakeTime: string
    sleepTargetTime: string
    capacityHours: number
  }): Promise<void> => {
    await window.focusOS.daily.upsert({
      settings_date: getTodayDateString(),
      wake_time: values.wakeTime,
      sleep_target_time: values.sleepTargetTime,
      remaining_minutes_at_wake: values.capacityHours * 60,
      buffer_percent: 10,
    })
    setShowWakeModal(false)
  }

  return (
    <div className="focus-app-bg flex h-screen min-h-screen flex-col">
      <TopStatusBar />
      <div className="relative z-10 flex min-h-0 flex-1">
        <SidebarNav />
        <main className="min-w-0 flex-1 overflow-y-auto p-shell">{children}</main>
      </div>
      <WakeTimeModal
        open={showWakeModal}
        defaultSleepTime={defaultSleepTime}
        defaultCapacityHours={defaultCapacityHours}
        onConfirm={handleWakeConfirm}
      />
      <LongBreakModal />
      <ReplanSummaryModal />
    </div>
  )
}
