import { useEffect, useState } from 'react'
import { computeCountdownSeconds, formatCountdown } from '@shared/utils/remainingTime'

export function ActiveBlockTimer({
  startedAt,
  paused,
  endsAt,
  durationMinutes,
}: {
  startedAt: string
  paused?: boolean
  endsAt?: string
  durationMinutes?: number | null
}): React.JSX.Element {
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    if (paused) {
      return
    }

    const update = (): void => {
      setRemainingSeconds(
        computeCountdownSeconds({
          nowMs: Date.now(),
          endsAt,
          startedAt,
          durationMinutes,
        })
      )
    }

    update()
    const intervalId = window.setInterval(update, 1000)
    return () => window.clearInterval(intervalId)
  }, [startedAt, paused, endsAt, durationMinutes])

  return (
    <span className={remainingSeconds < 0 ? 'focus-timer focus-timer-overdue' : 'focus-timer'}>
      {formatCountdown(remainingSeconds)}
    </span>
  )
}
