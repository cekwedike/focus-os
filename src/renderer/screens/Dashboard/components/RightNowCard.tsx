import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { ActiveBlockTimer } from '@renderer/components/schedule/ActiveBlockTimer'
import { useState } from 'react'

export function RightNowCard(): React.JSX.Element {
  const { activeBlock, refresh } = useScheduleContext()
  const [paused, setPaused] = useState(false)

  if (!activeBlock) {
    return (
      <section className="rounded-button border border-surface-border bg-surface-card p-4">
        <h3 className="text-sm font-semibold text-text-primary">Right Now</h3>
        <p className="mt-2 text-sm text-text-muted">No active block. Start one from Schedule.</p>
      </section>
    )
  }

  const complete = async (): Promise<void> => {
    await window.focusOS.schedule.completeBlock({ blockId: activeBlock.id })
    await refresh()
  }

  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-4">
      <h3 className="text-sm font-semibold text-text-primary">Right Now</h3>
      <p className="mt-2 text-base font-medium text-text-primary">{activeBlock.title}</p>
      {activeBlock.actual_start && (
        <div className="mt-2">
          <ActiveBlockTimer startedAt={activeBlock.actual_start} paused={paused} />
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="rounded-button border border-surface-border px-3 py-1.5 text-xs text-text-secondary"
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          onClick={() => void complete()}
          className="rounded-button bg-accent-mint/20 px-3 py-1.5 text-xs font-medium text-accent-mint"
        >
          Complete
        </button>
      </div>
    </section>
  )
}
