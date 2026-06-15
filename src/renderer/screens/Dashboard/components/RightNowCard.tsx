import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { ActiveBlockTimer } from '@renderer/components/schedule/ActiveBlockTimer'
import { useEffect, useState } from 'react'

interface RightNowCardProps {
  variant?: 'dashboard' | 'sidebar'
}

export function RightNowCard({ variant = 'dashboard' }: RightNowCardProps): React.JSX.Element {
  const { activeBlock, refresh, isBlockSkippable } = useScheduleContext()
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    void window.focusOS.work.getPaused().then((response) => {
      setPaused(response.paused)
    })
  }, [activeBlock?.id])

  const isSidebar = variant === 'sidebar'
  const heroClass = isSidebar ? 'focus-hero-panel focus-hero-panel-sidebar' : 'focus-hero-panel'
  const titleClass = isSidebar
    ? 'mt-3 truncate font-display text-xl font-bold tracking-tight text-text-primary'
    : 'mt-3 font-display text-2xl font-bold tracking-tight text-text-primary'
  const actionsClass = isSidebar
    ? 'flex flex-col gap-2'
    : 'flex flex-col gap-2 sm:flex-row sm:flex-wrap'

  if (!activeBlock) {
    return (
      <section className={heroClass}>
        <p className="focus-metric-label">Live Execution</p>
        <h2
          className={
            isSidebar
              ? 'mt-2 font-display text-xl font-bold text-text-primary'
              : 'mt-2 font-display text-2xl font-bold text-text-primary'
          }
        >
          Standby
        </h2>
        <p className={`mt-2 text-sm text-text-secondary ${isSidebar ? '' : 'max-w-md'}`}>
          No block is running. Your next block will start automatically when the schedule advances.
        </p>
      </section>
    )
  }

  const skippable = isBlockSkippable(activeBlock)

  const togglePause = (): void => {
    setPaused((current) => {
      const next = !current
      void window.focusOS.work.setPaused({ paused: next })
      return next
    })
  }

  const complete = async (): Promise<void> => {
    await window.focusOS.work.setPaused({ paused: false })
    setPaused(false)
    await window.focusOS.schedule.completeAndAdvance({ blockId: activeBlock.id })
    await refresh()
  }

  const extendBlock = async (): Promise<void> => {
    await window.focusOS.schedule.extendBlock({ blockId: activeBlock.id })
    await refresh()
  }

  const skipBlock = async (): Promise<void> => {
    await window.focusOS.schedule.skipBlock({ blockId: activeBlock.id })
    await refresh()
  }

  return (
    <section className={heroClass}>
      <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="focus-live-dot" aria-hidden="true" />
            <p className="focus-metric-label">Live Execution</p>
          </div>
          <h2 className={titleClass}>{activeBlock.title}</h2>
          <p className="mt-2 text-sm capitalize text-text-muted">
            {activeBlock.block_type.replace(/_/g, ' ')} · {activeBlock.status}
          </p>
          {activeBlock.actual_start && (
            <div className="mt-4">
              <ActiveBlockTimer
                startedAt={activeBlock.actual_start}
                paused={paused}
                endsAt={activeBlock.planned_end}
              />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className={actionsClass}>
            <button
              type="button"
              onClick={togglePause}
              className={`focus-btn-ghost ${isSidebar ? 'w-full' : 'w-full sm:w-auto'}`}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={() => void extendBlock()}
              className={`focus-btn-ghost ${isSidebar ? 'w-full' : 'w-full sm:w-auto'}`}
            >
              Extend +5
            </button>
            {skippable ? (
              <button
                type="button"
                onClick={() => void skipBlock()}
                className={`focus-btn-ghost ${isSidebar ? 'w-full' : 'w-full sm:w-auto'}`}
              >
                Skip
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void complete()}
              className={`focus-btn-primary ${isSidebar ? 'w-full' : 'w-full sm:w-auto'}`}
            >
              Complete Block
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
