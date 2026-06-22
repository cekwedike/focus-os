import { useScheduleContext } from '@renderer/context/ScheduleContext'

export function useChatInputPlaceholder(): string {
  const { dayBundle } = useScheduleContext()
  const wakeLogged = Boolean(dayBundle?.settings?.wake_time)

  if (!wakeLogged) {
    return 'e.g. 9 or 9:30'
  }

  return 'Message your assistant…'
}
