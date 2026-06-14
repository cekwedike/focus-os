import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AllocationOutput } from '@shared/allocation/types'
import type { ClientProjectRow } from '@shared/types/db'
import type { FixedBlockOverride, DailySettingsNotes } from '@shared/types/schedule'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import { getTodayDateString } from '@renderer/utils/date'

export function useDailyWorkspace() {
  const today = getTodayDateString()
  const [wakeTime, setWakeTime] = useState('08:00')
  const [sleepTargetTime, setSleepTargetTime] = useState('22:00')
  const [capacityHours, setCapacityHours] = useState(8)
  const [bufferPercent, setBufferPercent] = useState(10)
  const [clients, setClients] = useState<ClientProjectRow[]>([])
  const [fixedOverrides, setFixedOverrides] = useState<FixedBlockOverride[]>([])
  const [preview, setPreview] = useState<AllocationOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasExistingSchedule, setHasExistingSchedule] = useState(false)

  const fixedClients = useMemo(
    () =>
      clients.filter(
        (client) => client.fixed_block_enabled === 1 && !isSystemUnassignedClient(client.name)
      ),
    [clients]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [daily, clientRows, dayBundle, settingsResponse] = await Promise.all([
        window.focusOS.daily.get({ date: today }),
        window.focusOS.clients.list(),
        window.focusOS.schedule.getDay({ date: today }),
        window.focusOS.settings.get(),
      ])

      const settings = daily.settings
      const yesterday = daily.yesterday

      setWakeTime(settings?.wake_time ?? yesterday?.wake_time ?? '08:00')
      setSleepTargetTime(
        settings?.sleep_target_time ?? yesterday?.sleep_target_time ?? settingsResponse.settings.defaultSleepTime ?? '22:00'
      )
      const capacityMinutes =
        settings?.remaining_minutes_at_wake ?? yesterday?.remaining_minutes_at_wake ?? 480
      setCapacityHours(Math.round(capacityMinutes / 60))
      setBufferPercent(settings?.buffer_percent ?? settingsResponse.settings.defaultBufferPercent)
      setClients(clientRows.filter((client) => !isSystemUnassignedClient(client.name)))
      setHasExistingSchedule(dayBundle.blocks.length > 0)

      if (settings?.notes) {
        try {
          const parsed = JSON.parse(settings.notes) as DailySettingsNotes
          setFixedOverrides(parsed.fixedBlockOverrides ?? [])
        } catch {
          setFixedOverrides([])
        }
      }
    } catch (loadError) {
      setError(String(loadError))
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    void load()
  }, [load])

  const autoAssign = async (): Promise<void> => {
    setGenerating(true)
    setError(null)
    try {
      const result = await window.focusOS.schedule.generate({
        scheduleDate: today,
        wakeTime,
        sleepTargetTime,
        bufferPercent,
        capacityMinutes: capacityHours * 60,
        fixedBlockOverrides: fixedOverrides,
      })
      setPreview(result)
    } catch (generateError) {
      setError(String(generateError))
    } finally {
      setGenerating(false)
    }
  }

  const confirmSchedule = async (confirmOverwrite = false): Promise<void> => {
    if (!preview) {
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const notes = JSON.stringify({ fixedBlockOverrides: fixedOverrides })
      await window.focusOS.schedule.commit({
        scheduleDate: today,
        confirmOverwrite,
        settings: {
          settings_date: today,
          wake_time: wakeTime,
          sleep_target_time: sleepTargetTime,
          buffer_percent: bufferPercent,
          remaining_minutes_at_wake: capacityHours * 60,
          notes,
        },
        blocks: preview.blocks,
      })
      setPreview(null)
      setHasExistingSchedule(true)
    } catch (commitError) {
      setError(String(commitError))
      throw commitError
    } finally {
      setGenerating(false)
    }
  }

  const updateFixedOverride = (clientId: number, start: string, durationMinutes: number): void => {
    setFixedOverrides((current) => {
      const others = current.filter((entry) => entry.clientId !== clientId)
      return [...others, { clientId, start, durationMinutes }]
    })
  }

  return {
    today,
    wakeTime,
    setWakeTime,
    sleepTargetTime,
    setSleepTargetTime,
    capacityHours,
    setCapacityHours,
    bufferPercent,
    setBufferPercent,
    fixedClients,
    fixedOverrides,
    updateFixedOverride,
    preview,
    loading,
    generating,
    error,
    hasExistingSchedule,
    autoAssign,
    confirmSchedule,
    refresh: load,
  }
}
