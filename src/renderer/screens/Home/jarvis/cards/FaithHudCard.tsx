import { useState } from 'react'
import { motion } from 'framer-motion'
import { useFaithStreak } from '@renderer/hooks/useFaithStreak'
import { useFaithEntry } from '@renderer/context/FaithEntryContext'
import { useChatContext } from '@renderer/context/ChatContext'
import { HudCard } from '../JarvisCard'
import { JarvisRingGauge } from '../JarvisRingGauge'

export function FaithHudCard(): React.JSX.Element {
  const { stats, loading } = useFaithStreak()
  const { isFaithBlockActive, openFaithEntry } = useFaithEntry()
  const { sendMessage } = useChatContext()
  const [expanded, setExpanded] = useState(false)

  const current = stats?.currentStreak ?? 0
  const longest = stats?.longestStreak ?? 0
  const monthEntries = stats?.entriesThisMonth ?? 0

  return (
    <HudCard
      accent="violet"
      expanded={expanded}
      onClick={() => setExpanded((o) => !o)}
      className={isFaithBlockActive ? 'jarvis-card-expanded' : ''}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="jarvis-kicker">Faith streak</p>
          {loading || !stats ? (
            <p className="mt-2 text-sm text-text-muted">Syncing...</p>
          ) : (
            <>
              <p className="jarvis-value mt-1 text-2xl">{current}d</p>
              <p className="text-[10px] text-text-muted">Record {longest}d</p>
            </>
          )}
        </div>
        <JarvisRingGauge
          value={current}
          max={Math.max(longest, current, 1)}
          size={64}
          color="#a78bfa"
          label="streak"
        />
      </div>

      {expanded ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 space-y-2 border-t border-surface-border/50 pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-xs text-text-secondary">{monthEntries} entries this month</p>
          {isFaithBlockActive ? (
            <button type="button" className="focus-btn-primary w-full text-xs" onClick={openFaithEntry}>
              Log faith block
            </button>
          ) : (
            <button
              type="button"
              className="focus-btn-ghost w-full text-xs"
              onClick={() => void sendMessage('faith streak')}
            >
              Open streak report
            </button>
          )}
        </motion.div>
      ) : null}
    </JarvisCard>
  )
}
