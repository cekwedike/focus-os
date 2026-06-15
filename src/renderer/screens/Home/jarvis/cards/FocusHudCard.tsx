import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useChatContext } from '@renderer/context/useChatContext'
import { HudCard } from '../JarvisCard'
import { JarvisRingGauge } from '../JarvisRingGauge'
import { JarvisMiniBars, type JarvisBarDatum } from '../JarvisMiniBars'

export function FocusHudCard(): React.JSX.Element {
  const { dayBundle } = useScheduleContext()
  const { sendMessage } = useChatContext()
  const [expanded, setExpanded] = useState(false)

  const score = dayBundle?.focusScore ?? 0
  const hasScore = dayBundle?.focusScore !== null && dayBundle?.focusScore !== undefined

  const completionBars = useMemo((): JarvisBarDatum[] => {
    if (!dayBundle?.blocks.length) {
      return []
    }
    const workBlocks = dayBundle.blocks
      .filter((b) => b.block_type === 'fixed_client' || b.block_type === 'weighted_client')
      .slice(0, 6)
    return workBlocks.map((block) => ({
      id: block.id,
      label: block.title.slice(0, 5),
      value: block.status === 'completed' ? 100 : block.status === 'active' ? 55 : 20,
      color: block.status === 'completed' ? '#00e5a8' : '#22d3ee',
      status: block.status,
    }))
  }, [dayBundle])

  return (
    <HudCard accent="mint" expanded={expanded} onClick={() => setExpanded((o) => !o)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="hud-kicker">Focus index</p>
          <p className="hud-value mt-1 text-2xl">{hasScore ? `${score}%` : '--'}</p>
          <p className="mt-1 text-[10px] text-text-muted">Work block completion</p>
        </div>
        <JarvisRingGauge value={hasScore ? score : 0} size={64} active={hasScore} />
      </div>

      {expanded ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 border-t border-surface-border/50 pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          {completionBars.length > 0 ? (
            <JarvisMiniBars data={completionBars} height={48} maxValue={100} />
          ) : (
            <p className="text-xs text-text-muted">No work blocks logged today.</p>
          )}
          <button
            type="button"
            className="focus-btn-ghost mt-3 w-full text-xs"
            onClick={() => void sendMessage('focus score')}
          >
            Analyze focus
          </button>
        </motion.div>
      ) : null}
    </HudCard>
  )
}
