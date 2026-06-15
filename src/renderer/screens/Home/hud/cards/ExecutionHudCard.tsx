import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { ActiveBlockTimer } from '@renderer/components/schedule/ActiveBlockTimer'
import { HudCard } from '../HudCard'
import { HudOrb } from '../HudOrb'
import { HudWaveform } from '../HudWaveform'
import { HudMiniBars, type HudBarDatum } from '../HudMiniBars'

export function ExecutionHudCard(): React.JSX.Element {
  const { activeBlock, dayBundle, refresh, isBlockSkippable } = useScheduleContext()
  const [paused, setPaused] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    void window.focusOS.work.getPaused().then((response) => {
      setPaused(response.paused)
    })
  }, [activeBlock?.id])

  const blockBars = useMemo((): HudBarDatum[] => {
    if (!dayBundle?.blocks.length) {
      return []
    }
    return dayBundle.blocks.slice(0, 8).map((block) => ({
      id: block.id,
      label: block.title.slice(0, 6),
      value: block.planned_duration_minutes,
      status: block.status,
      color:
        block.status === 'active'
          ? '#00e5a8'
          : block.status === 'completed'
            ? '#6c8ef5'
            : block.status === 'skipped'
              ? '#64748b'
              : '#22d3ee',
    }))
  }, [dayBundle])

  const togglePause = (): void => {
    setPaused((current) => {
      const next = !current
      void window.focusOS.work.setPaused({ paused: next })
      return next
    })
  }

  const complete = async (): Promise<void> => {
    if (!activeBlock) {
      return
    }
    await window.focusOS.work.setPaused({ paused: false })
    setPaused(false)
    await window.focusOS.schedule.completeAndAdvance({ blockId: activeBlock.id })
    await refresh()
  }

  const extendBlock = async (): Promise<void> => {
    if (!activeBlock) {
      return
    }
    await window.focusOS.schedule.extendBlock({ blockId: activeBlock.id })
    await refresh()
  }

  const skipBlock = async (): Promise<void> => {
    if (!activeBlock) {
      return
    }
    await window.focusOS.schedule.skipBlock({ blockId: activeBlock.id })
    await refresh()
  }

  const skippable = activeBlock ? isBlockSkippable(activeBlock) : false

  return (
    <HudCard
      span="full"
      accent="mint"
      expanded={expanded}
      onClick={() => setExpanded((open) => !open)}
      className="min-h-[140px]"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <HudOrb active={Boolean(activeBlock)} />
          <HudWaveform active={Boolean(activeBlock) && !paused} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={activeBlock ? 'focus-live-dot' : 'focus-live-dot-idle'} />
            <p className="hud-kicker">Live Execution</p>
          </div>
          <h2 className="hud-value mt-1 truncate text-lg sm:text-xl">
            {activeBlock ? activeBlock.title : 'Standby Mode'}
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {activeBlock
              ? `${activeBlock.block_type.replace(/_/g, ' ')} · ${activeBlock.status}`
              : 'Awaiting Schedule Activation'}
          </p>
          {activeBlock?.actual_start ? (
            <div className="mt-2">
              <ActiveBlockTimer
                startedAt={activeBlock.actual_start}
                paused={paused}
                endsAt={activeBlock.planned_end}
              />
            </div>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 border-t border-surface-border/60 pt-4">
              {blockBars.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] tracking-wide text-text-muted">Timeline Density</p>
                  <HudMiniBars data={blockBars} height={56} />
                </div>
              ) : null}

              {activeBlock ? (
                <div
                  className="flex flex-wrap gap-2"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <button type="button" onClick={togglePause} className="focus-btn-ghost text-xs">
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void extendBlock()}
                    className="focus-btn-ghost text-xs"
                  >
                    Extend +5
                  </button>
                  {skippable ? (
                    <button
                      type="button"
                      onClick={() => void skipBlock()}
                      className="focus-btn-ghost text-xs"
                    >
                      Skip
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void complete()}
                    className="focus-btn-primary text-xs"
                  >
                    Complete
                  </button>
                </div>
              ) : (
                <p className="text-xs text-text-secondary">
                  Tap to expand telemetry. Say &quot;what&apos;s next&quot; to queue the next block.
                </p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </HudCard>
  )
}
