import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { extractLocalTimeHHMM } from '@shared/utils/scheduleTimestamp'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { useBreakContext } from '@renderer/context/BreakContext'
import { HudCard } from '../JarvisCard'
import { JarvisRingGauge } from '../JarvisRingGauge'

export function BreakHudCard(): React.JSX.Element {
  const { dayBundle } = useScheduleContext()
  const { formatHHMM } = useDisplayPreferences()
  const { openLongBreakModal } = useBreakContext()
  const [expanded, setExpanded] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const nextMicroBreak = useMemo(() => {
    if (!dayBundle) {
      return null
    }
    return (
      dayBundle.blocks.find(
        (block) =>
          block.protected_subtype === 'micro_break' &&
          block.status === 'planned' &&
          new Date(block.planned_start).getTime() > nowMs
      ) ?? null
    )
  }, [dayBundle, nowMs])

  const minutesUntil = nextMicroBreak
    ? Math.max(0, Math.round((new Date(nextMicroBreak.planned_start).getTime() - nowMs) / 60000))
    : 0

  const progress =
    nextMicroBreak && nextMicroBreak.planned_duration_minutes > 0
      ? Math.min(100, (1 - minutesUntil / Math.max(nextMicroBreak.planned_duration_minutes, 60)) * 100)
      : 0

  return (
    <HudCard accent="cyan" expanded={expanded} onClick={() => setExpanded((o) => !o)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="hud-kicker">Next break</p>
          {nextMicroBreak ? (
            <>
              <p className="mt-1 font-mono text-lg text-accent-cyan">
                {formatHHMM(extractLocalTimeHHMM(nextMicroBreak.planned_start))}
              </p>
              <p className="text-[10px] text-text-muted">{minutesUntil}m until break</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-text-muted">No micro-break scheduled</p>
          )}
        </div>
        <JarvisRingGauge
          value={nextMicroBreak ? progress : 0}
          max={100}
          size={56}
          color="#22d3ee"
          active={Boolean(nextMicroBreak)}
        />
      </div>

      {expanded ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 border-t border-surface-border/50 pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" className="focus-btn-primary w-full text-xs" onClick={openLongBreakModal}>
            Initiate long break
          </button>
        </motion.div>
      ) : null}
    </HudCard>
  )
}
