import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { ActiveBlockTimer } from '@renderer/components/schedule/ActiveBlockTimer'
import { useState } from 'react'

export function RightNowCard(): React.JSX.Element {
  const { activeBlock, refresh } = useScheduleContext()
  const [paused, setPaused] = useState(false)

  if (!activeBlock) {
    return (
      <section className="focus-hero-panel">
        <p className="focus-metric-label">Live execution</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-text-primary">Standby</h2>
        <p className="mt-2 max-w-md text-sm text-text-secondary">
          No block is running. Start your next block from Schedule to activate live tracking.
        </p>
      </section>
    )
  }

  const togglePause = (): void => {
    setPaused((current) => {
      const next = !current
      void window.focusOS.work.setPaused({ paused: next })
      return next
    })
  }

  const complete = async (): Promise<void> => {
    await window.focusOS.work.setPaused({ paused: false })
    await window.focusOS.schedule.completeBlock({ blockId: activeBlock.id })
    await refresh()
  }

  return (
    <section className="focus-hero-panel">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="focus-live-dot" aria-hidden="true" />
            <p className="focus-metric-label">Live execution</p>
          </div>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            {activeBlock.title}
          </h2>
          <p className="mt-2 text-sm capitalize text-text-muted">
            {activeBlock.block_type.replace(/_/g, ' ')} · {activeBlock.status}
          </p>
          {activeBlock.actual_start && (
            <div className="mt-4">
              <ActiveBlockTimer startedAt={activeBlock.actual_start} paused={paused} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <button
            type="button"
            onClick={togglePause}
            className="focus-btn-ghost w-full sm:w-auto"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={() => void complete()}
            className="focus-btn-primary w-full sm:w-auto"
          >
            Complete Block
          </button>
        </div>
      </div>
    </section>
  )
}
