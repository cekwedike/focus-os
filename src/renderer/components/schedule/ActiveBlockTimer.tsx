import { useEffect, useState } from 'react'

export function ActiveBlockTimer({
  startedAt,
  paused,
}: {
  startedAt: string
  paused?: boolean
}): React.JSX.Element {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (paused) {
      return
    }
    const update = (): void => {
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)))
    }
    update()
    const intervalId = window.setInterval(update, 1000)
    return () => window.clearInterval(intervalId)
  }, [startedAt, paused])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  return (
    <span className="font-mono text-sm tabular-nums text-accent-mint">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  )
}
