import { useState } from 'react'
import { motion } from 'framer-motion'
import { useScheduleContext } from '@renderer/context/ScheduleContext'
import { useDisplayPreferences } from '@renderer/context/DisplayPreferencesContext'
import { useChatContext } from '@renderer/context/ChatContext'
import { formatCountdownFromMinutes } from '@shared/utils/remainingTime'
import { extractLocalTimeHHMM } from '@shared/utils/scheduleTimestamp'
import { HudCard } from '../JarvisCard'

export function QueueHudCard(): React.JSX.Element {
  const { nextBlock } = useScheduleContext()
  const { formatHHMM } = useDisplayPreferences()
  const { sendMessage } = useChatContext()
  const [expanded, setExpanded] = useState(false)

  const handleActivate = (): void => {
    void sendMessage("what's next")
  }

  return (
    <HudCard
      accent="cyan"
      expanded={expanded}
      onClick={() => setExpanded((open) => !open)}
    >
      <p className="hud-kicker">Up next</p>
      {nextBlock ? (
        <>
          <motion.p
            key={nextBlock.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-2 truncate font-display text-base font-semibold text-text-primary"
          >
            {nextBlock.title}
          </motion.p>
          <p className="mt-1 font-mono text-xs text-accent-cyan">
            {formatHHMM(extractLocalTimeHHMM(nextBlock.planned_start))}
            {' · '}
            {formatCountdownFromMinutes(nextBlock.planned_duration_minutes)}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-text-muted">No blocks queued</p>
      )}

      {expanded ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex flex-wrap gap-2 border-t border-surface-border/50 pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" className="focus-btn-primary text-xs" onClick={handleActivate}>
            Query next
          </button>
          <button
            type="button"
            className="focus-btn-ghost text-xs"
            onClick={() => void sendMessage('show schedule')}
          >
            Full timeline
          </button>
        </motion.div>
      ) : null}
    </HudCard>
  )
}
